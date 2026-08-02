"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import type { IAdminModelWithCount } from "@/lib/admin";

/**
 * Khung khu quản trị. Tách hẳn khỏi (main): không có TabBar, không giới hạn
 * bề rộng — bảng dữ liệu cần càng rộng càng tốt.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user === null) router.replace("/login");
  }, [isLoading, user, router]);

  const modelsQuery = useQuery({
    queryKey: ["admin-models"],
    enabled: !!user,
    retry: false,
    queryFn: () =>
      api.get<{ models: IAdminModelWithCount[] }>("/admin/models"),
  });

  const models = modelsQuery.data?.models ?? [];
  const forbidden =
    modelsQuery.error instanceof ApiError && modelsQuery.error.status === 403;

  return (
    <div className="min-h-dvh lg:flex">
      {/* Thanh bên */}
      <aside className="shrink-0 border-b-3 border-sign bg-enamel-deep lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:overflow-y-auto lg:border-r-3 lg:border-b-0">
        <div className="border-b-2 border-panel/12 px-5 py-5">
          <p className="disp text-[1.1rem] leading-none tracking-[0.1em] text-sign">
            Quản trị
          </p>
          <p className="mt-1.5 truncate text-[0.68rem] text-panel/50">
            StudentBites · {user?.name}
          </p>
        </div>

        <nav className="flex flex-wrap gap-1.5 px-3 py-3 lg:flex-col lg:flex-nowrap">
          {modelsQuery.isPending && !!user
            ? Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))
            : models.map((m) => {
                const href = `/admin/${m.name}`;
                const active = pathname === href;
                return (
                  <Link
                    key={m.name}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between gap-2 border-2 px-2.5 py-2 text-[0.75rem] font-semibold transition-colors ${
                      active
                        ? "border-ink bg-sign text-ink shadow-hard-sm"
                        : "border-transparent text-panel/65 hover:border-panel/25 hover:text-panel"
                    }`}
                  >
                    <span className="truncate">{m.label}</span>
                    <span className="num shrink-0 text-[0.65rem] opacity-60">
                      {m.count}
                    </span>
                  </Link>
                );
              })}
        </nav>

        <div className="border-t-2 border-panel/12 px-3 py-3">
          <Link
            href="/home"
            className="disp press flex items-center justify-center gap-1.5 border-2 border-panel/30 py-2 text-[0.58rem] tracking-[0.12em] text-panel/70 hover:border-sign hover:text-sign"
          >
            <Icon name="chevronLeft" className="size-3.5" />
            Về app
          </Link>
        </div>
      </aside>

      {/* Nội dung */}
      <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-7">
        {forbidden ? (
          <Banner tone="critical">
            {modelsQuery.error instanceof ApiError
              ? modelsQuery.error.message
              : "Tài khoản này không có quyền quản trị."}
          </Banner>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
