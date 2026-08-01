"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import { formatDistance, formatVnd, toDateStr } from "@/lib/format";
import {
  type ICompareResult,
  type IGeocodeResult,
  type IStore,
} from "@/lib/types";

// Leaflet must be client-only (no SSR)
const StoresMap = dynamic(() => import("@/components/StoresMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-2xl bg-gray-100">
      <p className="text-sm text-gray-400">Đang tải bản đồ...</p>
    </div>
  ),
});

// Default: trung tâm TP.HCM (KTX ĐHQG)
const DEFAULT_CENTER: [number, number] = [10.87, 106.8];

const RADIUS_OPTIONS = [
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "3km", value: 3000 },
  { label: "5km", value: 5000 },
];

const STORE_TYPE_LABELS: Record<string, string> = {
  MARKET: "Chợ",
  SUPERMARKET: "Siêu thị",
  CONVENIENCE: "Cửa hàng",
  ONLINE: "Online",
};

/** Directions deep-link: mở Google Maps (Apple Maps trên iOS tự động). */
function directionsUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?daddr=${lat},${lng}`;
}

export default function StoresPage() {
  const queryClient = useQueryClient();
  const today = toDateStr();

  // Location state
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [radius, setRadius] = useState(2000);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<IStore | null>(null);

  // Tab: map vs compare
  const [tab, setTab] = useState<"map" | "compare">("map");

  // Geocode search
  const geocodeMutation = useMutation({
    mutationFn: (q: string) =>
      api.get<{ results: IGeocodeResult[] }>(
        `/stores/geocode?q=${encodeURIComponent(q)}`,
      ),
    onSuccess: (data) => {
      if (data.results.length > 0) {
        const first = data.results[0];
        setCenter([first.lat, first.lng]);
      }
    },
  });

  // Nearby stores
  const nearbyQuery = useQuery({
    queryKey: ["stores-nearby", center[0], center[1], radius],
    queryFn: () =>
      api.get<{ stores: IStore[]; radius: number }>(
        `/stores/nearby?lat=${center[0]}&lng=${center[1]}&radius=${radius}`,
      ),
    enabled: tab === "map",
  });

  // Price comparison for today's plan
  const compareQuery = useQuery({
    queryKey: ["stores-compare", today],
    queryFn: () => api.get<ICompareResult>(`/stores/compare?date=${today}`),
    enabled: tab === "compare",
  });

  const stores = nearbyQuery.data?.stores ?? [];
  const compare = compareQuery.data;

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 3) {
      geocodeMutation.mutate(searchQuery.trim());
    }
  }, [searchQuery, geocodeMutation]);

  const handleMarkerClick = useCallback((store: IStore) => {
    setSelectedStore(store);
  }, []);

  return (
    <main className="px-4 pt-6">
      <h1 className="mb-4 text-xl font-bold">Mua sắm 🛒</h1>

      {/* Tab switch */}
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        {(
          [
            ["map", "Cửa hàng gần bạn"],
            ["compare", "So sánh giá"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === key ? "bg-white shadow-sm" : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "map" && (
        <>
          {/* Search address */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Nhập địa chỉ (KTX, phòng trọ...)"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
            <button
              onClick={handleSearch}
              disabled={geocodeMutation.isPending}
              className="shrink-0 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              🔍
            </button>
          </div>
          {geocodeMutation.isError && (
            <p className="mb-2 text-xs text-red-500">
              {geocodeMutation.error instanceof ApiError
                ? geocodeMutation.error.message
                : "Không tìm thấy địa chỉ"}
            </p>
          )}

          {/* Radius selector */}
          <div className="mb-3 flex gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRadius(opt.value)}
                className={`flex-1 rounded-full py-2 text-xs font-medium transition ${
                  radius === opt.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white text-gray-600 shadow-sm"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="mb-4 overflow-hidden rounded-2xl shadow-sm">
            <StoresMap
              center={center}
              stores={stores}
              radiusM={radius}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          {/* Selected store info */}
          {selectedStore && (
            <div className="mb-4 rounded-2xl bg-green-50 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-green-800">
                    {selectedStore.name}
                  </p>
                  {selectedStore.address && (
                    <p className="mt-0.5 text-xs text-gray-600">
                      {selectedStore.address}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {STORE_TYPE_LABELS[selectedStore.type] ?? selectedStore.type}{" "}
                    · {formatDistance(selectedStore.distanceM)}
                  </p>
                </div>
                <a
                  href={directionsUrl(selectedStore.lat, selectedStore.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  🧭 Chỉ đường
                </a>
              </div>
            </div>
          )}

          {/* Stores list */}
          {nearbyQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Đang tìm cửa hàng gần bạn...
            </p>
          ) : stores.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold">
                {stores.length} cửa hàng gần bạn
              </h2>
              <ul className="space-y-2">
                {stores.slice(0, 15).map((store) => (
                  <li
                    key={store.id}
                    className={`flex items-center gap-3 rounded-xl p-3 transition ${
                      selectedStore?.id === store.id
                        ? "bg-green-50 ring-1 ring-green-300"
                        : "bg-white shadow-sm"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {store.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {STORE_TYPE_LABELS[store.type] ?? store.type} ·{" "}
                        {formatDistance(store.distanceM)}
                      </p>
                    </div>
                    <a
                      href={directionsUrl(store.lat, store.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700"
                    >
                      🧭
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className="rounded-2xl bg-white py-8 text-center shadow-sm">
              <p className="text-3xl">🗺️</p>
              <p className="mt-2 text-sm text-gray-500">
                Nhập địa chỉ để tìm cửa hàng gần bạn
              </p>
            </div>
          )}
        </>
      )}

      {tab === "compare" && (
        <>
          {compareQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Đang tải so sánh giá...
            </p>
          ) : compare && compare.items.length > 0 ? (
            <>
              {/* Best total banner */}
              <div className="mb-4 rounded-2xl bg-green-600 p-4 text-white shadow-lg shadow-green-600/20">
                <p className="text-xs opacity-80">
                  Tổng tiền mua rẻ nhất (tối ưu từng món)
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatVnd(compare.bestTotal)}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  cho thực đơn hôm nay ({compare.items.length} nguyên liệu)
                </p>
              </div>

              {/* Store totals ranking */}
              {compare.storeTotals.length > 0 && (
                <section className="mb-4">
                  <h2 className="mb-2 text-sm font-semibold">
                    Tổng tiền theo nguồn
                  </h2>
                  <div className="space-y-2">
                    {compare.storeTotals.map((st, idx) => (
                      <div
                        key={st.storeId}
                        className={`flex items-center gap-3 rounded-xl p-3 ${
                          idx === 0 ? "bg-green-50 ring-1 ring-green-200" : "bg-white shadow-sm"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {st.storeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {st.itemCount} sản phẩm
                          </p>
                        </div>
                        <p
                          className={`shrink-0 font-bold ${
                            idx === 0 ? "text-green-600" : "text-gray-700"
                          }`}
                        >
                          {formatVnd(st.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Ingredient breakdown */}
              <section>
                <h2 className="mb-2 text-sm font-semibold">
                  Chi tiết từng nguyên liệu
                </h2>
                <div className="space-y-3">
                  {compare.items.map((item) => (
                    <div
                      key={item.ingredientId}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">
                          {item.name}{" "}
                          <span className="text-xs text-gray-400">
                            ({item.grams}g)
                          </span>
                        </p>
                        {item.bestOffer && (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
                            Rẻ nhất: {formatVnd(item.bestOffer.estimatedCost)}
                          </span>
                        )}
                      </div>
                      {item.offers.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.offers.map((offer) => (
                            <div
                              key={`${offer.storeId}-${offer.productName}`}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {offer.storeName}
                                </p>
                                <p className="text-gray-500">
                                  {offer.productName}
                                </p>
                                {offer.productUrl && (
                                  <a
                                    href={offer.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 underline"
                                  >
                                    Xem sản phẩm ↗
                                  </a>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-bold text-gray-800">
                                  {formatVnd(offer.estimatedCost)}
                                </p>
                                <p className="text-gray-400">
                                  {formatVnd(offer.pricePer100g)}/100g
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Chưa có giá từ nguồn nào
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl bg-white py-10 text-center shadow-sm">
              <p className="text-4xl">📊</p>
              <p className="mt-2 text-sm text-gray-500">
                Chưa có thực đơn hôm nay.
                <br />
                Tạo thực đơn trước để xem so sánh giá!
              </p>
            </div>
          )}
          {compareQuery.isError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {compareQuery.error instanceof ApiError
                ? compareQuery.error.message
                : "Không thể tải so sánh giá"}
            </p>
          )}
        </>
      )}
    </main>
  );
}
