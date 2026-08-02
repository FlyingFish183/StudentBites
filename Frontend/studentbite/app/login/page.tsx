"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { api, ApiError } from "@/lib/api";
import AuthShell from "@/components/AuthShell";

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white " +
  "placeholder-white/35 outline-none backdrop-blur-md transition " +
  "focus:border-emerald-400/60 focus:bg-white/10 focus:ring-2 focus:ring-emerald-400/20";

const fields = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};
const field = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

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
    <AuthShell
      icon="🍚"
      title="Chào mừng trở lại"
      subtitle="Ăn đủ chất, vừa túi tiền sinh viên"
    >
      <motion.form
        onSubmit={onSubmit}
        variants={fields}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={field}>
          <label className="mb-1 block text-sm font-medium text-white/70">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sinhvien@gmail.com"
            className={inputCls}
          />
        </motion.div>
        <motion.div variants={field}>
          <label className="mb-1 block text-sm font-medium text-white/70">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className={inputCls}
          />
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, x: [-6, 6, -6, 6, 0] }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-200"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          variants={field}
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="group relative w-full overflow-hidden rounded-xl bg-emerald-500 py-3.5 text-base font-semibold text-[#04120c] shadow-[0_12px_40px_-10px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 disabled:opacity-60"
        >
          <span className="relative z-10">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </motion.button>
      </motion.form>

      <p className="mt-6 text-center text-sm text-white/60">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-300 hover:text-emerald-200"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
}
