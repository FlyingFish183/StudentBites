"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type { IUser } from "@/lib/types";

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
