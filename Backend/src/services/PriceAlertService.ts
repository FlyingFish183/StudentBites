import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import prisma, { Prisma } from '@src/repos/prisma';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  NOT_FOUND: 'Không tìm thấy cảnh báo',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Hook sau crawl: detect price drops, tạo notification cho user đã đặt alert.
 * @returns Số notification đã tạo
 */
async function checkAfterCrawl(_sourceSite: string): Promise<number> {
  // a. Lấy các bản ghi giá trong 30 phút gần nhất
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const recentChanges = await prisma.productPriceHistory.findMany({
    where: { recordedAt: { gte: cutoff } },
    include: {
      product: {
        include: { ingredient: true, store: true },
      },
    },
  });

  if (recentChanges.length === 0) return 0;

  // b. Với mỗi product, tìm giá trước đó để so sánh
  const priceDrops: Array<{
    ingredientId: number;
    ingredientName: string;
    productName: string;
    storeName: string;
    oldPrice: number;
    newPrice: number;
    dropPct: number;
  }> = [];

  for (const entry of recentChanges) {
    const { product } = entry;
    // Bỏ qua product chưa map nguyên liệu
    if (!product.ingredientId || !product.ingredient) continue;

    const newPrice = Number(entry.price);

    // Tìm bản ghi giá trước đó cho cùng product
    const prevEntry = await prisma.productPriceHistory.findFirst({
      where: {
        productId: entry.productId,
        recordedAt: { lt: entry.recordedAt },
      },
      orderBy: { recordedAt: 'desc' },
    });
    if (!prevEntry) continue;

    const oldPrice = Number(prevEntry.price);

    // Chỉ quan tâm giá giảm
    if (oldPrice <= 0 || newPrice >= oldPrice) continue;

    const dropPct = ((oldPrice - newPrice) / oldPrice) * 100;

    priceDrops.push({
      ingredientId: product.ingredientId,
      ingredientName: product.ingredient.name,
      productName: product.name,
      storeName: product.store.name,
      oldPrice,
      newPrice,
      dropPct,
    });
  }

  if (priceDrops.length === 0) return 0;

  // c. Load các PriceAlert đang active cho những ingredientId có giảm giá
  const affectedIngredientIds = [
    ...new Set(priceDrops.map((d) => d.ingredientId)),
  ];
  const alerts = await prisma.priceAlert.findMany({
    where: {
      ingredientId: { in: affectedIngredientIds },
      isActive: true,
    },
  });

  if (alerts.length === 0) return 0;

  // d. Ghép cặp (alert, priceDrop) và lọc theo ngưỡng
  const toNotify: Array<{
    userId: number;
    ingredientId: number;
    title: string;
    payload: Prisma.InputJsonValue;
  }> = [];

  for (const alert of alerts) {
    const drops = priceDrops.filter(
      (d) => d.ingredientId === alert.ingredientId,
    );
    for (const drop of drops) {
      if (drop.dropPct < alert.thresholdPct) continue;

      toNotify.push({
        userId: alert.userId,
        ingredientId: drop.ingredientId,
        title: `${drop.ingredientName} giảm ${Math.round(drop.dropPct)}% tại ${drop.storeName}`,
        payload: {
          ingredientId: drop.ingredientId,
          ingredientName: drop.ingredientName,
          productName: drop.productName,
          store: drop.storeName,
          oldPrice: drop.oldPrice,
          newPrice: drop.newPrice,
          dropPct: Math.round(drop.dropPct),
        },
      });
    }
  }

  if (toNotify.length === 0) return 0;

  // e. Deduplicate: không tạo notification trùng (userId, ingredientId) trong 24h
  const dedupCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const userIds = [...new Set(toNotify.map((n) => n.userId))];
  const existingNotifications = await prisma.notification.findMany({
    where: {
      userId: { in: userIds },
      type: 'price_drop',
      createdAt: { gte: dedupCutoff },
    },
    select: { userId: true, payload: true },
  });

  // Build set "userId:ingredientId" đã có notification trong 24h
  const existingKeys = new Set<string>();
  for (const n of existingNotifications) {
    const p = n.payload as { ingredientId?: number } | null;
    if (p?.ingredientId != null) {
      existingKeys.add(`${n.userId}:${p.ingredientId}`);
    }
  }

  const newNotifications = toNotify.filter(
    (n) => !existingKeys.has(`${n.userId}:${n.ingredientId}`),
  );

  if (newNotifications.length === 0) return 0;

  // f. Batch create
  await prisma.notification.createMany({
    data: newNotifications.map((n) => ({
      userId: n.userId,
      type: 'price_drop',
      title: n.title,
      payload: n.payload,
    })),
  });

  // g. Return count
  return newNotifications.length;
}

/**
 * Tạo hoặc cập nhật cảnh báo giá cho một nguyên liệu.
 */
async function createAlert(
  userId: number,
  ingredientId: number,
  thresholdPct: number,
) {
  const alert = await prisma.priceAlert.upsert({
    where: { userId_ingredientId: { userId, ingredientId } },
    update: { thresholdPct, isActive: true },
    create: { userId, ingredientId, thresholdPct },
    include: { ingredient: { select: { name: true } } },
  });

  return {
    id: alert.id,
    ingredientId: alert.ingredientId,
    ingredientName: alert.ingredient?.name ?? '',
    thresholdPct: alert.thresholdPct,
    isActive: alert.isActive,
  };
}

/**
 * Xoá cảnh báo (kiểm tra quyền sở hữu).
 */
async function deleteAlert(userId: number, id: number): Promise<void> {
  const alert = await prisma.priceAlert.findFirst({
    where: { id, userId },
  });
  if (!alert) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.NOT_FOUND);
  }
  await prisma.priceAlert.delete({ where: { id } });
}

/**
 * Lấy danh sách cảnh báo của user.
 */
async function getUserAlerts(userId: number) {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId },
    include: { ingredient: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return alerts.map((a) => ({
    id: a.id,
    ingredientId: a.ingredientId,
    ingredientName: a.ingredient?.name ?? '',
    thresholdPct: a.thresholdPct,
    isActive: a.isActive,
  }));
}

/**
 * Lấy các notification giảm giá gần nhất (cho chat tool).
 */
async function getPriceDrops(userId: number, limit = 10) {
  return prisma.notification.findMany({
    where: { userId, type: 'price_drop' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Lấy danh sách thông báo của user.
 */
async function getUserNotifications(userId: number, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Đánh dấu một notification đã đọc.
 */
async function markNotificationRead(
  userId: number,
  notificationId: number,
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  checkAfterCrawl,
  createAlert,
  deleteAlert,
  getUserAlerts,
  getPriceDrops,
  getUserNotifications,
  markNotificationRead,
} as const;
