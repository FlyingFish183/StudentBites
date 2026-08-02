"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import AuthShell from "@/components/ui/AuthShell";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
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
          ? "Email hoặc mật khẩu chưa đúng."
          : "Không đăng nhập được. Kiểm tra mạng rồi thử lại.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Vào quán"
      intro="Đăng nhập để xem thực đơn và ngân sách hôm nay."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-bold text-sign underline underline-offset-4"
          >
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sinhvien@gmail.com"
        />
        <Field
          label="Mật khẩu"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
        />

        {error && <Banner tone="critical">{error}</Banner>}

        <Button type="submit" full loading={loading} className="mt-1">
          {loading ? "Đang vào quán" : "Đăng nhập"}
        </Button>
      </form>
    </AuthShell>
  );
}
