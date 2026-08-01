"use client";

import { useQuery } from "@tanstack/react-query";

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
