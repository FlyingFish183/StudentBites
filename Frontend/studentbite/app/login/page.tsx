"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email hoặc mật khẩu không đúng"
          : "Không thể đăng nhập, thử lại sau",
      );
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mb-10 text-center">
        <div className="text-5xl">🍚</div>
        <h1 className="mt-3 text-3xl font-bold text-green-700">StudentBites</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ăn đủ chất, vừa túi tiền sinh viên
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sinhvien@gmail.com"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-600 py-3.5 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-green-600">
          Đăng ký ngay
        </Link>
      </p>
    </main>
  );
}
