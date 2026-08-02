"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Board from "@/components/ui/Board";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton, { SkeletonRows } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDistance, formatVnd, toDateStr } from "@/lib/format";
import {
  STORE_TYPE_LABELS,
  type ICompareResult,
  type IGeocodeResult,
  type IStore,
} from "@/lib/types";

/** Leaflet đụng tới window nên chỉ nạp phía client. */
const StoreMap = dynamic(() => import("@/components/StoreMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-65 w-full" />,
});

/** Trung tâm TP.HCM — dùng khi người dùng chưa cho phép định vị. */
const FALLBACK_CENTER = { lat: 10.7769, lng: 106.7009 };
const RADIUS_OPTIONS = [1000, 2000, 5000];
const STORE_PREVIEW = 8;

interface ICenter {
  lat: number;
  lng: number;
  /** Nhãn hiện trên thanh vị trí. */
  label: string;
}

export default function StoresPage() {
  const today = toDateStr();
  const [center, setCenter] = useState<ICenter | null>(null);
  const [radius, setRadius] = useState(2000);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAllStores, setShowAllStores] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [locating, setLocating] = useState(true);
  const [locateError, setLocateError] = useState("");
  const [geocodeError, setGeocodeError] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  // Hỏi vị trí một lần khi vào màn; từ chối thì rơi về trung tâm thành phố.
  useEffect(() => {
    function fallbackToCityCenter(message: string) {
      setCenter({ ...FALLBACK_CENTER, label: "TP. Hồ Chí Minh" });
      setLocateError(message);
      setLocating(false);
    }

    const geo = navigator.geolocation;
    if (!geo) {
      // Hoãn sang lượt sau để không đổi state ngay trong thân effect.
      const timer = window.setTimeout(
        () =>
          fallbackToCityCenter(
            "Trình duyệt này không hỗ trợ định vị. Nhập địa chỉ để tìm đúng khu bạn ở.",
          ),
        0,
      );
      return () => window.clearTimeout(timer);
    }

    geo.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Vị trí của bạn",
        });
        setLocating(false);
      },
      () =>
        fallbackToCityCenter(
          "Chưa bật được định vị nên đang lấy trung tâm TP.HCM. Nhập địa chỉ để tìm đúng khu bạn ở.",
        ),
      { timeout: 8000 },
    );
  }, []);

  const nearbyQuery = useQuery({
    queryKey: ["stores-nearby", center?.lat, center?.lng, radius],
    enabled: !!center,
    queryFn: () =>
      api.get<{ stores: IStore[]; radius: number }>(
        `/stores/nearby?lat=${center!.lat}&lng=${center!.lng}&radius=${radius}`,
      ),
  });

  const compareQuery = useQuery({
    queryKey: ["stores-compare", today],
    queryFn: () => api.get<ICompareResult>(`/stores/compare?date=${today}`),
  });

  async function onSearchAddress(e: React.FormEvent) {
    e.preventDefault();
    if (addressInput.trim().length < 3) return;
    setGeocodeError("");
    setGeocoding(true);
    try {
      const { results } = await api.get<{ results: IGeocodeResult[] }>(
        `/stores/geocode?q=${encodeURIComponent(addressInput.trim())}`,
      );
      const first = results[0];
      if (!first) {
        setGeocodeError("Không tìm thấy địa chỉ này. Thử ghi rõ quận/phường.");
      } else {
        setCenter({ lat: first.lat, lng: first.lng, label: first.label });
        setLocateError("");
        setSelectedId(null);
      }
    } catch (err) {
      setGeocodeError(
        err instanceof ApiError
          ? err.message
          : "Không tra được địa chỉ. Kiểm tra mạng rồi thử lại.",
      );
    } finally {
      setGeocoding(false);
    }
  }

  const stores = nearbyQuery.data?.stores ?? [];
  // Overpass hay trả về vài chục cửa hàng tiện lợi; chỉ mở gần nhất trước.
  const visibleStores = showAllStores ? stores : stores.slice(0, STORE_PREVIEW);
  const hiddenCount = stores.length - visibleStores.length;
  const compare = compareQuery.data;
  const cheapestStoreId = compare?.storeTotals[0]?.storeId ?? null;

  return (
    <main>
      <PageHeader title="Đi chợ" aside="Nguyên liệu của thực đơn hôm nay" />

      <div className="anim-rise-sm anim-delay-1 stagger-in grid gap-6 px-4 pt-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-6 lg:pt-5">
      <div>
      {/* Vị trí */}
      <div className="pb-3">
        <form onSubmit={onSearchAddress} className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Nhập địa chỉ hoặc tên đường"
              aria-label="Địa chỉ cần tìm"
              className="w-full border-2 border-ink bg-panel py-2.5 pr-3 pl-9 text-[0.85rem] font-semibold text-ink placeholder:font-normal placeholder:text-ink/35 focus:outline-none"
            />
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/40"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            loading={geocoding}
            disabled={addressInput.trim().length < 3}
          >
            Tìm
          </Button>
        </form>

        <div className="mt-2.5 flex items-center gap-2">
          <Icon name="pin" className="size-3.5 shrink-0 text-mint" />
          <p className="min-w-0 flex-1 truncate text-[0.72rem] text-panel/65">
            {locating ? "Đang lấy vị trí…" : (center?.label ?? "—")}
          </p>
          <div className="flex gap-1.5">
            {RADIUS_OPTIONS.map((r) => (
              <Chip
                key={r}
                active={radius === r}
                onClick={() => setRadius(r)}
                className="px-2 py-1"
              >
                {r / 1000}km
              </Chip>
            ))}
          </div>
        </div>

        {locateError && (
          <Banner tone="warn" className="mt-2.5">
            {locateError}
          </Banner>
        )}
        {geocodeError && (
          <Banner tone="critical" className="mt-2.5">
            {geocodeError}
          </Banner>
        )}
      </div>

      {/* Bản đồ */}
      <div className="pb-5">
        {center ? (
          <StoreMap
            center={center}
            radius={radius}
            stores={stores}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <Skeleton className="h-65 w-full" />
        )}
      </div>

      {/* Cửa hàng quanh đây */}
      <Board
        title="Quanh đây"
        icon="pin"
        aside={stores.length > 0 ? `${stores.length} chỗ` : undefined}
      >
        {nearbyQuery.isPending ? (
          <SkeletonRows rows={3} />
        ) : nearbyQuery.isError ? (
          <Banner tone="critical">
            Không tải được danh sách cửa hàng. Kéo xuống rồi thử lại sau.
          </Banner>
        ) : stores.length === 0 ? (
          <EmptyState
            icon="pin"
            title="Không thấy chỗ nào trong bán kính này"
            hint="Nới bán kính lên 5km hoặc nhập địa chỉ khác."
          />
        ) : (
          <ul>
            {visibleStores.map((s) => (
              <li key={s.id}>
                <div
                  className={`rule-soft flex items-center gap-3 py-2.5 first:border-t-0 ${
                    selectedId === s.id ? "bg-panel/5" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="label text-sign">
                      {STORE_TYPE_LABELS[s.type]}
                    </p>
                    <p className="mt-0.5 truncate text-[0.85rem] font-semibold">
                      {s.name}
                    </p>
                    <p className="num mt-0.5 truncate text-[0.68rem] text-panel/55">
                      Cách {formatDistance(s.distanceM)}
                      {s.address ? ` · ${s.address}` : ""}
                    </p>
                  </button>
                  <a
                    href={`https://maps.google.com/?daddr=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="disp press inline-flex shrink-0 items-center gap-1 border-2 border-panel/35 px-2 py-1.5 text-[0.55rem] tracking-[0.12em] text-panel/75 hover:border-sign hover:text-sign"
                  >
                    <Icon name="navigate" className="size-3" />
                    Chỉ đường
                  </a>
                </div>
              </li>
            ))}
            {hiddenCount > 0 && (
              <li className="pt-3">
                <Button
                  full
                  variant="ghost"
                  icon="plus"
                  onClick={() => setShowAllStores(true)}
                >
                  Xem thêm {hiddenCount} chỗ
                </Button>
              </li>
            )}
          </ul>
        )}
      </Board>
      </div>

      {/* So sánh giá nguyên liệu */}
      <Board title="Mua ở đâu rẻ nhất" icon="cart" className="lg:sticky lg:top-6">
        {compareQuery.isPending ? (
          <SkeletonRows rows={4} />
        ) : !compare || compare.items.length === 0 ? (
          <EmptyState
            icon="cart"
            title="Chưa có gì để so giá"
            hint="Tạo thực đơn cho hôm nay trước, app sẽ gom nguyên liệu rồi tìm nơi bán rẻ nhất."
          />
        ) : (
          <>
            {compare.bestTotal > 0 && (
              <div className="panel mb-4 bg-sign px-4 py-4 text-ink">
                <p className="label opacity-70">
                  Mua đủ nguyên liệu hôm nay hết
                </p>
                <p className="disp-num mt-1.5 text-[2.1rem]">
                  {formatVnd(compare.bestTotal)}
                </p>
                <div className="my-2 h-0.5 bg-ink" />
                <p className="text-[0.7rem] font-bold">
                  Đã chọn nơi rẻ nhất cho từng nguyên liệu.
                </p>
              </div>
            )}

            {/* Tổng theo từng cửa hàng */}
            {compare.storeTotals.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-[0.75rem]">
                  <thead>
                    <tr className="label text-panel/45">
                      <th className="py-1 text-left">Nếu mua hết ở</th>
                      <th className="py-1 text-right">Số món</th>
                      <th className="py-1 text-right">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compare.storeTotals.map((st) => (
                      <tr key={st.storeId} className="rule-soft">
                        <td className="py-1.5 pr-2">
                          <span className="font-semibold">{st.storeName}</span>
                          {st.storeId === cheapestStoreId && (
                            <span className="label ml-1.5 bg-mint px-1 py-0.5 text-ink">
                              Rẻ nhất
                            </span>
                          )}
                        </td>
                        <td className="num py-1.5 text-right text-panel/55">
                          {st.itemCount}
                        </td>
                        <td className="num py-1.5 text-right font-bold">
                          {formatVnd(st.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Từng nguyên liệu */}
            <ul>
              {compare.items.map((item) => (
                <li
                  key={item.ingredientId}
                  className="rule-soft py-2.5 first:border-t-0"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="min-w-0 truncate text-[0.85rem] font-semibold">
                      {item.name}
                      <span className="num ml-1.5 text-[0.68rem] font-medium text-panel/50">
                        {item.grams}g
                      </span>
                    </p>
                    <p className="disp-num shrink-0 text-[0.95rem]">
                      {item.bestOffer
                        ? formatVnd(item.bestOffer.estimatedCost)
                        : "—"}
                    </p>
                  </div>
                  {item.bestOffer ? (
                    <p className="mt-0.5 truncate text-[0.68rem] text-panel/55">
                      Rẻ nhất tại{" "}
                      <span className="font-bold text-mint">
                        {item.bestOffer.storeName}
                      </span>
                      {item.offers.length > 1 &&
                        ` · còn ${item.offers.length - 1} nơi khác`}
                      {/* Nguồn online có link sản phẩm thì mở thẳng ra để
                          người dùng tự kiểm giá — chợ ngoài thì không có. */}
                      {item.bestOffer.productUrl && (
                        <>
                          {" · "}
                          <a
                            href={item.bestOffer.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-sign underline underline-offset-2"
                          >
                            Xem sản phẩm
                          </a>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[0.68rem] text-panel/45">
                      Chưa có nơi nào báo giá cho nguyên liệu này.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Board>
      </div>
    </main>
  );
}
