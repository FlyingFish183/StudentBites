"use client";

import { useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/hooks";
import type { INotification } from "@/lib/types";

type Filter = "all" | "unread";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = data?.notifications ?? [];
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.readAt)
      : notifications;

  const handleClick = (n: INotification) => {
    if (!n.readAt) {
      markRead.mutate(n.id);
    }
  };

  return (
    <main>
      <PageHeader eyebrow="Thông báo" title="Khuyến mãi hôm nay" />

      <div className="px-4 pt-4 lg:px-6 lg:pt-6">
        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(
            [
              ["all", "Tất cả"],
              ["unread", "Chưa đọc"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`disp chip-pop border-2 px-4 py-1.5 text-[0.6rem] tracking-[0.12em] ${
                filter === key
                  ? "border-sign bg-sign text-ink shadow-hard-sm"
                  : "border-panel/25 text-panel/60 hover:border-panel/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-18 w-full animate-pulse rounded border-2 border-panel/10 bg-panel/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="bell"
            title="Chưa có khuyến mãi nào"
            hint="Hệ thống sẽ báo khi nguyên liệu bạn theo dõi giảm giá"
          />
        ) : (
          <div className="stagger-in grid gap-3">
            {filtered.map((n) => {
              const drop = n.payload.dropPct;
              const isUnread = !n.readAt;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`panel-hover border-2 px-4 py-3 text-left transition-colors ${
                    isUnread
                      ? "border-sign/40 bg-enamel-deep"
                      : "border-panel/12 bg-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <Icon
                        name="bell"
                        className="size-4.5"
                        strokeWidth={isUnread ? 2.4 : 1.8}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-[0.82rem] leading-snug ${
                            isUnread ? "font-bold text-panel" : "text-panel/75"
                          }`}
                        >
                          {n.title}
                        </p>
                        {drop >= 10 && (
                          <span className="disp shrink-0 border-2 border-chili bg-chili/15 px-1.5 py-0.5 text-[0.55rem] tracking-wider text-chili">
                            -{Math.round(drop)}%
                          </span>
                        )}
                        {drop > 0 && drop < 10 && (
                          <span className="disp shrink-0 border-2 border-mango bg-mango/15 px-1.5 py-0.5 text-[0.55rem] tracking-wider text-mango">
                            -{Math.round(drop)}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[0.68rem] text-panel/50">
                        <span>{n.payload.store}</span>
                        <span>·</span>
                        <span>{relativeTime(n.createdAt)}</span>
                        {isUnread && (
                          <span className="ml-auto size-2 shrink-0 rounded-full bg-sign" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
