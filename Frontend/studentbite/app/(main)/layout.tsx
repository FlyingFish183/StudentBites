"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ChatBox from "@/components/ChatBox";
import SideNav from "@/components/SideNav";
import TabBar from "@/components/TabBar";
import Icon from "@/components/ui/Icon";
import { useMe } from "@/lib/hooks";

/**
 * Layout cho các tab chính: yêu cầu đăng nhập, rồi dựng khung theo màn hình —
 * cột 480px + tab bar dưới cùng trên điện thoại, thanh bên + nội dung rộng
 * trên desktop.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading, isFetching } = useMe();

  useEffect(() => {
    // Wait for refetch — cached null from a logged-out visit must not
    // redirect while /auth/me is still in flight after login.
    if (!isLoading && !isFetching && user === null) {
      router.replace("/login");
    }
  }, [isLoading, isFetching, user, router]);

  if (isLoading || user === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center" role="status">
          <Icon
            name="bowl"
            className="mx-auto size-10 text-sign"
            strokeWidth={1.8}
          />
          <p className="disp mt-3 text-[0.7rem] tracking-[0.2em] text-panel/50">
            Đang dọn bàn
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:min-h-dvh">
      <SideNav />
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-120 pb-24 md:max-w-215 lg:max-w-295 lg:pb-12">
          {children}
        </div>
      </div>
      <TabBar />
      <ChatBox />
    </div>
  );
}
