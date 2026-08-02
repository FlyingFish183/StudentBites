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

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      // đăng ký xong -> khai báo thể trạng
      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không tạo được tài khoản. Kiểm tra mạng rồi thử lại.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Mở tài khoản"
      intro="Ba ô này thôi. Thể trạng và ngân sách khai ở bước sau."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-bold text-sign underline underline-offset-4"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Tên của bạn"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
        />
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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          hint="Tối thiểu 6 ký tự."
        />

        {error && <Banner tone="critical">{error}</Banner>}

        <Button type="submit" full loading={loading} className="mt-1">
          {loading ? "Đang tạo tài khoản" : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthShell>
  );
}
