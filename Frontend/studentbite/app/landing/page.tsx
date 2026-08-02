"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import HeroScene from "@/components/HeroScene";
import GlassCard from "@/components/GlassCard";
import Logo from "@/components/Logo";

const FEATURES = [
  {
    icon: "🍱",
    title: "Thực đơn thông minh",
    desc: "Gợi ý bữa ăn đủ protein, cân bằng dinh dưỡng và luôn nằm trong ngân sách của bạn.",
    glow: "52, 211, 153",
  },
  {
    icon: "📊",
    title: "Theo dõi dinh dưỡng",
    desc: "Vòng tròn calo & protein, thanh carb/fat trực quan cập nhật ngay khi bạn ăn.",
    glow: "245, 158, 11",
  },
  {
    icon: "💸",
    title: "Kiểm soát chi tiêu",
    desc: "Biểu đồ chi tiêu và cảnh báo khi vượt ngân sách để bạn luôn chủ động ví tiền.",
    glow: "244, 63, 94",
  },
  {
    icon: "🛒",
    title: "Tìm nơi mua rẻ nhất",
    desc: "So sánh giá nguyên liệu giữa Bách Hóa Xanh, WinMart, Co.op Mart quanh bạn.",
    glow: "52, 211, 153",
  },
];

const STEPS = [
  { n: "01", title: "Nhập mục tiêu", desc: "Cân nặng, mục tiêu và ngân sách tháng." },
  { n: "02", title: "Nhận thực đơn", desc: "Kế hoạch bữa ăn đủ chất, đúng túi tiền." },
  { n: "03", title: "Ăn & theo dõi", desc: "Đánh dấu đã ăn, xem dinh dưỡng & chi tiêu." },
];

const FLOATERS = [
  { e: "🥦", x: "8%", y: "18%", d: 0 },
  { e: "🍗", x: "84%", y: "22%", d: 0.6 },
  { e: "🍚", x: "16%", y: "70%", d: 1.1 },
  { e: "🥚", x: "78%", y: "68%", d: 0.3 },
  { e: "🍅", x: "50%", y: "12%", d: 0.9 },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#04120c] text-white">
      {/* Backdrop gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[34rem] w-[34rem] rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center">
          <Logo className="h-10 w-auto sm:h-12" badge priority />
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#04120c] shadow-[0_8px_24px_-6px_rgba(16,185,129,0.6)] transition hover:bg-emerald-400 active:scale-95"
          >
            Bắt đầu
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[78vh] items-center px-6 pb-16">
        <div className="absolute inset-0 z-0">
          <HeroScene />
        </div>

        {/* Floating food emojis */}
        {FLOATERS.map((f) => (
          <motion.span
            key={f.e}
            aria-hidden
            className="pointer-events-none absolute hidden select-none text-4xl drop-shadow-lg sm:block"
            style={{ left: f.x, top: f.y }}
            animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
            transition={{
              duration: 5 + f.d,
              repeat: Infinity,
              ease: "easeInOut",
              delay: f.d,
            }}
          >
            {f.e}
          </motion.span>
        ))}

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Dành riêng cho sinh viên Việt Nam
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl"
          >
            Ăn <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">đủ chất</span>,
            <br className="hidden sm:block" /> vừa túi tiền sinh viên
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg"
          >
            Lên thực đơn đủ protein trong ngân sách, theo dõi chi tiêu và tìm nơi
            mua nguyên liệu rẻ nhất — tất cả trong một ứng dụng.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/register"
              className="group relative w-full overflow-hidden rounded-full bg-emerald-500 px-8 py-3.5 text-base font-semibold text-[#04120c] shadow-[0_12px_40px_-10px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 active:scale-95 sm:w-auto"
            >
              <span className="relative z-10">Bắt đầu miễn phí →</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              href="/login"
              className="w-full rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/10 active:scale-95 sm:w-auto"
            >
              Đăng nhập
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            Mọi thứ bạn cần cho bữa ăn sinh viên
          </h2>
          <p className="mt-3 text-white/60">
            Di chuột lên từng thẻ để xem hiệu ứng kính mờ.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <GlassCard key={f.title} delay={i * 0.08} glow={f.glow}>
              <div className="text-4xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {f.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Bắt đầu chỉ với 3 bước
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md"
            >
              <span className="bg-gradient-to-br from-emerald-300 to-amber-300 bg-clip-text text-5xl font-black text-transparent">
                {s.n}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/65">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/20 to-amber-500/10 p-10 text-center backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/30 blur-[80px]" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">
            Sẵn sàng ăn ngon, tiết kiệm hơn?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/70">
            Tạo tài khoản miễn phí và nhận thực đơn đầu tiên của bạn ngay hôm nay.
          </p>
          <Link
            href="/register"
            className="relative mt-7 inline-block rounded-full bg-emerald-500 px-8 py-3.5 text-base font-semibold text-[#04120c] shadow-[0_12px_40px_-10px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 active:scale-95"
          >
            Tạo tài khoản ngay
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-sm text-white/50">
        <div className="mb-3 flex justify-center">
          <Logo className="h-9 w-auto" badge />
        </div>
        <p>Ăn đủ chất, vừa túi tiền sinh viên · © 2026</p>
      </footer>
    </main>
  );
}
