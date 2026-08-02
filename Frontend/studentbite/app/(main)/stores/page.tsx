"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import { formatDistance, formatVnd, toDateStr } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import CountUp from "@/components/CountUp";
import {
  type ICompareResult,
  type IGeocodeResult,
  type IStore,
} from "@/lib/types";

// Leaflet must be client-only (no SSR)
const StoresMap = dynamic(() => import("@/components/StoresMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl bg-surface-2">
      <p className="text-sm text-muted">Đang tải bản đồ...</p>
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
  const today = toDateStr();

  // Location state
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [radius, setRadius] = useState(2000);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<IStore | null>(null);

  // Mobile tab (desktop shows split view — both at once)
  const [tab, setTab] = useState<"map" | "compare">("map");

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

  const nearbyQuery = useQuery({
    queryKey: ["stores-nearby", center[0], center[1], radius],
    queryFn: () =>
      api.get<{ stores: IStore[]; radius: number }>(
        `/stores/nearby?lat=${center[0]}&lng=${center[1]}&radius=${radius}`,
      ),
  });

  const compareQuery = useQuery({
    queryKey: ["stores-compare", today],
    queryFn: () => api.get<ICompareResult>(`/stores/compare?date=${today}`),
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
    <main className="px-4 pt-6 lg:px-8">
      <motion.h1
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 text-xl font-bold lg:text-2xl"
      >
        Mua sắm 🛒
      </motion.h1>

      {/* Tab switch — mobile only */}
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-surface-2 p-1 lg:hidden">
        {(
          [
            ["map", "Cửa hàng gần bạn"],
            ["compare", "So sánh giá"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative rounded-lg py-2 text-sm font-medium transition ${
              tab === key ? "text-foreground" : "text-muted"
            }`}
          >
            {tab === key && (
              <motion.span
                layoutId="stores-tab-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {/* Split view: map 60% / compare 40% trên desktop */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-5">
        {/* ---- MAP + NEARBY (left, 3/5) ---- */}
        <div
          className={`${tab === "map" ? "block" : "hidden"} lg:col-span-3 lg:block`}
        >
          {/* Search address */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Nhập địa chỉ (KTX, phòng trọ...)"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSearch}
              disabled={geocodeMutation.isPending}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              🔍
            </button>
          </div>
          {geocodeMutation.isError && (
            <p className="mb-2 text-xs text-warning">
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
                    ? "bg-primary text-white shadow-sm"
                    : "card text-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="mb-4 h-[300px] overflow-hidden rounded-2xl shadow-sm lg:h-[420px]">
            <StoresMap
              center={center}
              stores={stores}
              radiusM={radius}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          {/* Selected store info */}
          <AnimatePresence>
            {selectedStore && (
              <motion.div
                key={selectedStore.id}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4 overflow-hidden rounded-2xl bg-primary-soft p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary-dark">
                      {selectedStore.name}
                    </p>
                    {selectedStore.address && (
                      <p className="mt-0.5 text-xs text-muted">
                        {selectedStore.address}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {STORE_TYPE_LABELS[selectedStore.type] ??
                        selectedStore.type}{" "}
                      · {formatDistance(selectedStore.distanceM)}
                    </p>
                  </div>
                  <a
                    href={directionsUrl(selectedStore.lat, selectedStore.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                  >
                    🧭 Chỉ đường
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stores list */}
          {nearbyQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-muted">
              Đang tìm cửa hàng gần bạn...
            </p>
          ) : stores.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold">
                {stores.length} cửa hàng gần bạn
              </h2>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {stores.slice(0, 15).map((store) => (
                  <motion.li
                    key={store.id}
                    variants={fadeInUp}
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                      selectedStore?.id === store.id
                        ? "bg-primary-soft ring-1 ring-primary/40"
                        : "card"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {store.name}
                      </p>
                      <p className="text-xs text-muted">
                        {STORE_TYPE_LABELS[store.type] ?? store.type} ·{" "}
                        {formatDistance(store.distanceM)}
                      </p>
                    </div>
                    <a
                      href={directionsUrl(store.lat, store.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary-dark"
                    >
                      🧭
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          ) : (
            <div className="card rounded-2xl py-8 text-center">
              <p className="text-3xl">🗺️</p>
              <p className="mt-2 text-sm text-muted">
                Nhập địa chỉ để tìm cửa hàng gần bạn
              </p>
            </div>
          )}
        </div>

        {/* ---- COMPARE (right, 2/5) ---- */}
        <div
          className={`${tab === "compare" ? "block" : "hidden"} lg:col-span-2 lg:block`}
        >
          {compareQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted">
              Đang tải so sánh giá...
            </p>
          ) : compare && compare.items.length > 0 ? (
            <>
              {/* Best total banner — shimmer sweep */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-4 overflow-hidden rounded-2xl bg-primary-dark p-4 text-white shadow-lg shadow-primary/20"
              >
                <div className="shimmer pointer-events-none absolute inset-0" />
                <p className="relative text-xs opacity-80">
                  Tổng tiền mua rẻ nhất (tối ưu từng món)
                </p>
                <p className="relative mt-1 text-2xl font-bold">
                  <CountUp value={compare.bestTotal} format={formatVnd} />
                </p>
                <p className="relative mt-1 text-xs opacity-80">
                  cho thực đơn hôm nay ({compare.items.length} nguyên liệu)
                </p>
              </motion.div>

              {/* Store totals ranking */}
              {compare.storeTotals.length > 0 && (
                <section className="mb-4">
                  <h2 className="mb-2 text-sm font-semibold">
                    Tổng tiền theo nguồn
                  </h2>
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-2"
                  >
                    {compare.storeTotals.map((st, idx) => (
                      <motion.div
                        key={st.storeId}
                        variants={fadeInUp}
                        whileHover={{ x: 4 }}
                        className={`relative flex items-center gap-3 overflow-hidden rounded-xl p-3 ${
                          idx === 0
                            ? "bg-primary-soft ring-1 ring-primary/30"
                            : "card"
                        }`}
                      >
                        {idx === 0 && (
                          <div className="shimmer pointer-events-none absolute inset-0" />
                        )}
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary-dark">
                          {idx + 1}
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {st.storeName}
                          </p>
                          <p className="text-xs text-muted">
                            {st.itemCount} sản phẩm
                          </p>
                        </div>
                        <p
                          className={`relative shrink-0 font-bold ${
                            idx === 0 ? "text-primary-dark" : "text-foreground"
                          }`}
                        >
                          {formatVnd(st.total)}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Ingredient breakdown */}
              <section>
                <h2 className="mb-2 text-sm font-semibold">
                  Chi tiết từng nguyên liệu
                </h2>
                <div className="space-y-3">
                  {compare.items.map((item) => (
                    <div key={item.ingredientId} className="card rounded-2xl p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">
                          {item.name}{" "}
                          <span className="text-xs text-muted">
                            ({item.grams}g)
                          </span>
                        </p>
                        {item.bestOffer && (
                          <span className="rounded-full bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary-dark">
                            Rẻ nhất: {formatVnd(item.bestOffer.estimatedCost)}
                          </span>
                        )}
                      </div>
                      {item.offers.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.offers.map((offer) => (
                            <div
                              key={`${offer.storeId}-${offer.productName}`}
                              className="flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {offer.storeName}
                                </p>
                                <p className="text-muted">
                                  {offer.productName}
                                </p>
                                {offer.productUrl && (
                                  <a
                                    href={offer.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-dark underline"
                                  >
                                    Xem sản phẩm ↗
                                  </a>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-bold text-foreground">
                                  {formatVnd(offer.estimatedCost)}
                                </p>
                                <p className="text-muted">
                                  {formatVnd(offer.pricePer100g)}/100g
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">
                          Chưa có giá từ nguồn nào
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="card rounded-2xl py-10 text-center">
              <p className="text-4xl">📊</p>
              <p className="mt-2 text-sm text-muted">
                Chưa có thực đơn hôm nay.
                <br />
                Tạo thực đơn trước để xem so sánh giá!
              </p>
            </div>
          )}
          {compareQuery.isError && (
            <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
              {compareQuery.error instanceof ApiError
                ? compareQuery.error.message
                : "Không thể tải so sánh giá"}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
