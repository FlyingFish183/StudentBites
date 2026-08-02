"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useMe } from "@/lib/hooks";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 z-0 bg-gradient-to-b from-enamel-deep via-enamel to-enamel"
      aria-hidden
    />
  ),
});

const FEATURES = [
  {
    icon: "bowl" as const,
    title: "Thực đơn tự lên",
    body: "Đủ đạm trong ngày mà không vượt ngân sách — chọn món, chỉnh khẩu phần, xong.",
  },
  {
    icon: "calendar" as const,
    title: "Theo dõi chi tiêu",
    body: "Ghi từng bữa, biết tháng này còn tiêu được bao nhiêu trước khi hết tiền.",
  },
  {
    icon: "cart" as const,
    title: "Đi chợ thông minh",
    body: "So giá nguyên liệu giữa chợ và siêu thị quanh bạn, mua đúng chỗ rẻ.",
  },
] as const;

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function LandingPage() {
  const { data: user, isLoading } = useMe();
  const hydrated = useHydrated();
  const loggedIn = hydrated && !isLoading && !!user;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-enamel text-panel">
      {/* —— Hero: one composition —— */}
      <section className="relative isolate min-h-dvh">
        <HeroScene />

        {/* Soft enamel vignette so type stays readable without covering the 3D plane */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,56,60,0.35)_55%,rgba(8,56,60,0.78)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[42%] bg-gradient-to-t from-enamel via-enamel/80 to-transparent"
          aria-hidden
        />

        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 lg:px-10">
          <p className="disp text-[1.05rem] tracking-[0.12em] text-sign">
            StudentBites
          </p>
          <nav className="flex items-center gap-2">
            {loggedIn ? (
              <Link href="/home" className={buttonClass("primary", "sm")}>
                Vào app
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="disp press hidden border-2 border-panel/30 px-3 py-1.5 text-[0.62rem] tracking-[0.12em] text-panel/80 hover:border-sign hover:text-sign sm:inline-flex"
                >
                  Đăng nhập
                </Link>
                <Link href="/register" className={buttonClass("primary", "sm")}>
                  Bắt đầu
                </Link>
              </>
            )}
          </nav>
        </header>

        <div className="relative z-10 flex min-h-dvh flex-col justify-end px-5 pb-14 pt-28 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="landing-rise max-w-2xl">
            <p className="disp text-[clamp(2.6rem,9vw,5.5rem)] leading-[0.92] text-sign drop-shadow-[3px_3px_0_#06282b]">
              StudentBites
            </p>
            <h1 className="disp mt-4 max-w-xl text-[clamp(1.35rem,3.6vw,2.15rem)] leading-[1.05] text-panel">
              Ăn đủ chất, vừa túi tiền sinh viên
            </h1>
            <p className="mt-3 max-w-md text-[0.92rem] leading-relaxed text-panel/70 sm:text-[1rem]">
              Lên thực đơn đủ protein trong ngân sách, theo dõi chi tiêu và tìm
              nơi mua rẻ nhất — đúng kiểu bảng hiệu quán cơm quen thuộc.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {loggedIn ? (
                <Link href="/home" className={buttonClass("primary", "md")}>
                  Mở trang chủ
                  <Icon name="home" className="size-4" />
                </Link>
              ) : (
                <>
                  <Link href="/register" className={buttonClass("primary", "md")}>
                    Dùng miễn phí
                    <Icon name="bowl" className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="glass-hover glass-panel disp press inline-flex items-center gap-1.5 border-2 border-panel/25 px-4 py-3 text-[0.78rem] tracking-widest text-panel"
                  >
                    Đã có tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* —— Features —— */}
      <section className="relative z-10 border-t-3 border-ink bg-enamel-deep px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="label text-sign">Việc chính</p>
          <h2 className="disp mt-2 text-[clamp(1.6rem,3.5vw,2.4rem)]">
            Ba việc, một tấm biển
          </h2>
          <p className="mt-2 max-w-lg text-[0.9rem] text-panel/60">
            Không dashboard rối. Chỉ những gì giúp bạn ăn đủ và không cháy túi.
          </p>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <article className="glass-hover glass-panel group h-full border-2 border-ink p-5 shadow-hard-deep">
                  <div className="flex size-11 items-center justify-center border-2 border-ink bg-sign text-ink transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-hard-sm">
                    <Icon name={f.icon} className="size-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="disp mt-4 text-[1.05rem] tracking-[0.08em]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-panel/65">
                    {f.body}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* —— How it works —— */}
      <section className="relative z-10 px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="label text-sign">Cách dùng</p>
            <h2 className="disp mt-2 text-[clamp(1.6rem,3.5vw,2.4rem)]">
              Từ bảng hiệu đến bàn ăn
            </h2>
            <ol className="mt-8 space-y-5">
              {[
                "Tạo hồ sơ: ngân sách tháng, mục tiêu protein, mức vận động.",
                "App gợi ý thực đơn ngày — chỉnh món hoặc khẩu phần nếu muốn.",
                "Ghi bữa đã ăn, xem còn bao nhiêu tiền và bao nhiêu đạm.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="disp flex size-9 shrink-0 items-center justify-center border-2 border-ink bg-sign text-[0.85rem] text-ink shadow-hard-sm">
                    {i + 1}
                  </span>
                  <p className="pt-1.5 text-[0.9rem] leading-relaxed text-panel/75">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-hover glass-panel relative border-3 border-ink p-6 shadow-hard-deep sm:p-8">
            <div className="panel bg-sign px-4 py-5 text-center text-ink">
              <p className="disp text-[1.8rem] leading-none sm:text-[2.2rem]">
                StudentBites
              </p>
              <div className="mx-auto my-2.5 h-0.5 w-14 bg-ink" />
              <p className="text-[0.75rem] font-bold tracking-wide">
                Ăn đủ chất · Vừa túi tiền
              </p>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Protein", v: "chili" as const, n: "62g" },
                { k: "Carb", v: "sign" as const, n: "180g" },
                { k: "Kcal", v: "mint" as const, n: "1.8k" },
              ].map((m) => (
                <div
                  key={m.k}
                  className="border-2 border-ink bg-enamel-deep/80 px-2 py-3"
                >
                  <dt className="label text-panel/45">{m.k}</dt>
                  <dd
                    className={`disp-num mt-1 text-[1.15rem] ${
                      m.v === "chili"
                        ? "text-chili"
                        : m.v === "sign"
                          ? "text-sign"
                          : "text-mint"
                    }`}
                  >
                    {m.n}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* —— Closing CTA —— */}
      <section className="relative z-10 border-t-3 border-ink bg-enamel-deep px-5 py-16 lg:px-10 lg:py-20">
        <div className="glass-hover glass-panel mx-auto max-w-3xl border-3 border-ink px-6 py-10 text-center shadow-hard-deep sm:px-10">
          <p className="disp text-[clamp(1.5rem,4vw,2.3rem)] text-sign">
            Sẵn sàng dọn bàn?
          </p>
          <p className="mx-auto mt-3 max-w-md text-[0.9rem] text-panel/65">
            Mở tài khoản miễn phí — vài phút là có thực đơn ngày đầu tiên.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {loggedIn ? (
              <Link href="/home" className={buttonClass("primary", "md")}>
                Vào trang chủ
              </Link>
            ) : (
              <>
                <Link href="/register" className={buttonClass("primary", "md")}>
                  Đăng ký ngay
                </Link>
                <Link href="/login" className={buttonClass("ghost", "md")}>
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t-2 border-panel/10 px-5 py-8 text-center lg:px-10">
        <p className="disp text-[0.85rem] tracking-[0.14em] text-sign">
          StudentBites
        </p>
        <p className="mt-2 text-[0.75rem] text-panel/40">
          Ăn ngon, đủ chất, vừa túi tiền
        </p>
      </footer>
    </div>
  );
}
