import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudentBites — Ăn ngon, đủ chất, vừa túi tiền",
  description:
    "Lên thực đơn đủ protein trong ngân sách sinh viên, theo dõi chi tiêu và tìm nơi mua rẻ nhất.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>
          {/* Khung mobile-first: full màn hình trên mobile, 480px trên desktop */}
          <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-background shadow-xl shadow-black/5">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
