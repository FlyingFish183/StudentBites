import type { Metadata, Viewport } from "next";
import { Anton, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

import Providers from "@/components/Providers";

/** Chữ bảng hiệu: co hẹp, nét đậm, chỉ dùng in hoa. */
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
});

/** Chữ nội dung: thiết kế riêng cho tiếng Việt, dấu không bị chồng. */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
  themeColor: "#0c4a4e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${anton.variable} ${beVietnam.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-enamel">
        {/* Bề rộng do từng layout tự quyết: cột hẹp cho các màn đăng nhập,
            thanh bên + nội dung rộng cho phần thân app. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
