"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type { IUser, INotification, IPriceAlert, IIngredient } from "@/lib/types";

/** Lấy user hiện tại; trả null khi chưa đăng nhập (401). */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    retry: false,
    queryFn: async () => {
      try {
        const { user } = await api.get<{ user: IUser }>("/auth/me");
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
  });
}

/** Đăng xuất; dùng chung cho thanh bên (desktop) và header (mobile). */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      // Xoá sạch cache để tài khoản sau không thấy dữ liệu tài khoản trước.
      queryClient.clear();
      router.replace("/login");
    },
  });
}

/** Danh sách thông báo của user (khuyến mãi, cảnh báo giá…). */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.get<{ notifications: INotification[] }>("/notifications"),
    staleTime: 30_000,
  });
}

/** Số thông báo chưa đọc. */
export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.notifications.filter((n) => !n.readAt).length ?? 0;
}

/** Đánh dấu một thông báo đã đọc. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Danh sách cảnh báo giá đã đặt. */
export function usePriceAlerts() {
  return useQuery({
    queryKey: ["priceAlerts"],
    queryFn: () =>
      api.get<{ alerts: IPriceAlert[] }>("/price-alerts"),
  });
}

/** Danh sách nguyên liệu (dùng cho bộ chọn nguyên liệu). */
export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: () =>
      api.get<{ ingredients: IIngredient[] }>("/ingredients"),
    staleTime: 5 * 60_000, // ingredients rarely change
  });
}

/** Đặt cảnh báo giá cho một nguyên liệu. */
export function useCreatePriceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ingredientId: number; thresholdPct: number }) =>
      api.post("/price-alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    },
  });
}

/** Xoá cảnh báo giá. */
export function useDeletePriceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/price-alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    },
  });
}
