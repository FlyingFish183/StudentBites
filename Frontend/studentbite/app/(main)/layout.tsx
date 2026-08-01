"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import TabBar from "@/components/TabBar";
import { useMe } from "@/lib/hooks";

/** Layout cho các tab chính: yêu cầu đăng nhập + tab bar dưới cùng. */
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
          <p className="mt-2 text-sm text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-24">{children}</div>
      <TabBar />
    </>
  );
}
