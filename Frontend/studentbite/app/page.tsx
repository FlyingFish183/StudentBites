import type { Metadata } from "next";

import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "StudentBites — Ăn đủ chất, vừa túi tiền sinh viên",
  description:
    "Lên thực đơn đủ protein trong ngân sách sinh viên, theo dõi chi tiêu và tìm nơi mua rẻ nhất.",
};

/** Public marketing landing — outside (main) so guests are not sent to /login. */
export default function Page() {
  return <LandingPage />;
}
