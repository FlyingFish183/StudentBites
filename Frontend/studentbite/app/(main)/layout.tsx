"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import SideNav from "@/components/SideNav";
import TabBar from "@/components/TabBar";
import { useMe } from "@/lib/hooks";

/** Layout cho các tab chính: yêu cầu đăng nhập + shell responsive. */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user === null) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || user === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-4xl">🍚</div>
          <p className="mt-2 text-sm text-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px]">
      <SideNav />
      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <div className="mx-auto w-full max-w-[720px] lg:max-w-none">
          {children}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
