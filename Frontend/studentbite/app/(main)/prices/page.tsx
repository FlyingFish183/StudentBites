"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Board from "@/components/ui/Board";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { IPriceSearchResult } from "@/lib/types";

const SUGGESTIONS = ["thịt gà", "ức gà", "thịt heo", "trứng", "rau", "gạo"];

export default function PricesPage() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), 300);
    return () => window.clearTimeout(t);
  }, [input]);

  const enabled = debounced.length >= 2;
  const searchQuery = useQuery({
    queryKey: ["stores-search", debounced],
    enabled,
    queryFn: () =>
      api.get<IPriceSearchResult>(
        `/stores/search?q=${encodeURIComponent(debounced)}`,
      ),
  });

  const items = searchQuery.data?.items ?? [];

  return (
    <main className="mx-auto w-full max-w-120 px-0 pb-24 md:max-w-215 lg:max-w-none lg:px-0 lg:pb-10">
      <PageHeader
        eyebrow="So sánh giá"
        title="So giá"
        aside={
          enabled && !searchQuery.isPending
            ? `${items.length} nguyên liệu`
            : undefined
        }
      />

      <div className="space-y-5 px-4 pt-4 lg:px-6">
        <Board title="Tìm nguyên liệu" icon="search">
          <Field
            label="Bạn muốn mua gì?"
            placeholder="Ví dụ: thịt gà, ức gà, rau muống…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            hint="Gõ ít nhất 2 ký tự. App tìm theo tên nguyên liệu, sản phẩm và danh mục đã crawl."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className={`disp border-2 px-3 py-1.5 text-[0.58rem] tracking-[0.08em] transition-colors ${
                  input === s
                    ? "border-sign bg-sign text-ink"
                    : "border-panel/30 text-panel/65 hover:border-panel/55 hover:text-panel"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Board>

        {!enabled ? (
          <EmptyState
            icon="search"
            title="Gõ tên nguyên liệu để so giá"
            hint="Ví dụ «thịt gà» sẽ liệt kê ức gà, đùi gà… kèm giá từng siêu thị online."
          />
        ) : searchQuery.isPending ? (
          <Board title="Kết quả" icon="search">
            <SkeletonRows rows={4} />
          </Board>
        ) : searchQuery.isError ? (
          <Banner tone="critical">
            {searchQuery.error instanceof ApiError
              ? searchQuery.error.message
              : "Không tìm được giá. Thử lại sau."}
          </Banner>
        ) : items.length === 0 ? (
          <EmptyState
            icon="search"
            title={`Không thấy gì cho «${debounced}»`}
            hint="Thử từ ngắn hơn (gà, heo, trứng) hoặc tên cắt cụ thể hơn."
          />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.ingredientId}>
                <Board
                  title={item.name}
                  icon="cart"
                  aside={
                    <span className="label text-panel/45">{item.category}</span>
                  }
                >
                  {item.offers.length === 0 ? (
                    <p className="text-[0.75rem] text-panel/50">
                      Chưa có cửa hàng nào báo giá cho nguyên liệu này.
                    </p>
                  ) : (
                    <ul>
                      {item.offers.map((offer, idx) => {
                        const cheapest = idx === 0;
                        return (
                          <li
                            key={`${offer.storeId}-${offer.productName}`}
                            className={`rule-soft flex items-start gap-3 py-3 first:border-t-0 ${
                              cheapest ? "bg-panel/5" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[0.85rem] font-semibold">
                                  {offer.storeName}
                                </p>
                                {cheapest && (
                                  <span className="label bg-mint px-1.5 py-0.5 text-ink">
                                    Rẻ nhất
                                  </span>
                                )}
                                {offer.isReference && (
                                  <span className="label text-panel/45">
                                    Tham khảo
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-[0.7rem] text-panel/55">
                                {offer.productName}
                                {offer.rawUnit ? ` · ${offer.rawUnit}` : ""}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                                <p className="disp-num text-[1.05rem] text-sign">
                                  {formatVnd(offer.pricePer100g)}
                                  <span className="ml-1 text-[0.55rem] font-normal tracking-normal text-panel/50">
                                    /100g
                                  </span>
                                </p>
                                {offer.currentPrice != null && (
                                  <p className="num text-[0.72rem] text-panel/60">
                                    Gói {formatVnd(offer.currentPrice)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {offer.productUrl ? (
                              <a
                                href={offer.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="disp press inline-flex shrink-0 items-center gap-1 border-2 border-panel/35 px-2 py-1.5 text-[0.55rem] tracking-[0.12em] text-panel/75 hover:border-sign hover:text-sign"
                              >
                                <Icon name="arrowRight" className="size-3" />
                                Xem
                              </a>
                            ) : (
                              <span className="label shrink-0 self-center text-panel/35">
                                Không link
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Board>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
