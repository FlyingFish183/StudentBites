"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Field from "@/components/ui/Field";
import SelectCard from "@/components/ui/SelectCard";
import { api, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import {
  ACTIVITY_LABELS,
  GOAL_HINTS,
  GOAL_LABELS,
  type ActivityLevel,
  type Goal,
  type IProfile,
} from "@/lib/types";

const STEPS = ["Thể trạng", "Mục tiêu", "Ngân sách"] as const;
const BUDGET_PRESETS = [1_500_000, 2_000_000, 3_000_000, 4_000_000];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // form state
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATE");
  const [goal, setGoal] = useState<Goal>("GAIN_MUSCLE");
  const [monthlyBudget, setMonthlyBudget] = useState("3000000");

  // nếu đã có hồ sơ thì điền sẵn (vào từ trang cài đặt)
  useQuery({
    queryKey: ["profile-prefill"],
    retry: false,
    queryFn: async () => {
      const { profile } = await api.get<{ profile: IProfile | null }>(
        "/profile",
      );
      if (profile) {
        setHeightCm(String(profile.heightCm));
        setWeightKg(String(profile.weightKg));
        setAge(String(profile.age));
        setGender(profile.gender === "female" ? "female" : "male");
        setActivityLevel(profile.activityLevel);
        setGoal(profile.goal);
        setMonthlyBudget(String(profile.monthlyBudget));
      }
      return profile;
    },
  });

  const step1Valid =
    Number(heightCm) > 50 && Number(weightKg) > 20 && Number(age) >= 15;
  const budgetValid = Number(monthlyBudget) >= 300_000;

  async function onFinish() {
    setError("");
    setSaving(true);
    try {
      await api.put("/profile", {
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        age: Number(age),
        gender,
        activityLevel,
        goal,
        monthlyBudget: Number(monthlyBudget),
      });
      await queryClient.invalidateQueries();
      router.replace("/home");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Chưa lưu được hồ sơ. Kiểm tra mạng rồi thử lại.",
      );
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-140 flex-col px-5 py-7 lg:max-w-170 lg:py-14">
      {/* Bước hiện tại */}
      <div className="mb-7 flex items-start gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-2 border-2 ${
                i < step
                  ? "border-sign bg-sign"
                  : i === step
                    ? "border-sign bg-transparent"
                    : "border-panel/25 bg-transparent"
              }`}
            />
            <p
              className={`label mt-1.5 text-center ${
                i <= step ? "text-sign" : "text-panel/35"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <section className="flex-1 space-y-4">
          <header>
            <h1 className="disp text-[1.7rem] leading-none">Thể trạng</h1>
            <p className="mt-2 text-[0.8rem] text-panel/60">
              Dùng để tính lượng calo và protein bạn cần mỗi ngày.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Chiều cao"
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="170"
              suffix="cm"
            />
            <Field
              label="Cân nặng"
              type="number"
              inputMode="numeric"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="65"
              suffix="kg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tuổi"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="20"
            />
            <div>
              <p className="label mb-1.5 text-panel/70">Giới tính</p>
              <div className="grid grid-cols-2 gap-2">
                <SelectCard
                  compact
                  title="Nam"
                  selected={gender === "male"}
                  onClick={() => setGender("male")}
                />
                <SelectCard
                  compact
                  title="Nữ"
                  selected={gender === "female"}
                  onClick={() => setGender("female")}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="label mb-1.5 text-panel/70">Mức độ vận động</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((lv) => (
                <SelectCard
                  key={lv}
                  title={ACTIVITY_LABELS[lv]}
                  selected={activityLevel === lv}
                  onClick={() => setActivityLevel(lv)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="flex-1 space-y-4">
          <header>
            <h1 className="disp text-[1.7rem] leading-none">Mục tiêu</h1>
            <p className="mt-2 text-[0.8rem] text-panel/60">
              Quyết định lượng protein và calo mục tiêu mỗi ngày.
            </p>
          </header>
          <div className="space-y-2.5">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <SelectCard
                key={g}
                title={GOAL_LABELS[g]}
                hint={GOAL_HINTS[g]}
                selected={goal === g}
                onClick={() => setGoal(g)}
              />
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex-1 space-y-4">
          <header>
            <h1 className="disp text-[1.7rem] leading-none">Ngân sách</h1>
            <p className="mt-2 text-[0.8rem] text-panel/60">
              Tiền dành cho ăn uống mỗi tháng. App chia đều theo ngày rồi theo
              từng bữa.
            </p>
          </header>

          <Field
            label="Ngân sách tháng"
            type="number"
            inputMode="numeric"
            step={100_000}
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            suffix="đ"
          />

          <div className="flex flex-wrap gap-2">
            {BUDGET_PRESETS.map((v) => (
              <Chip
                key={v}
                active={Number(monthlyBudget) === v}
                onClick={() => setMonthlyBudget(String(v))}
              >
                {formatVnd(v)}
              </Chip>
            ))}
          </div>

          {budgetValid && (
            <div className="panel bg-sign px-4 py-4 text-ink">
              <p className="label opacity-70">Tương đương mỗi ngày</p>
              <p className="disp-num mt-1.5 text-[2.1rem]">
                {formatVnd(Number(monthlyBudget) / 30)}
              </p>
              <div className="my-2 h-0.5 bg-ink" />
              <p className="text-[0.7rem] font-bold">
                Chia cho 4 bữa: sáng 25% · trưa 35% · tối 30% · phụ 10%
              </p>
            </div>
          )}
        </section>
      )}

      {error && (
        <Banner tone="critical" className="mt-4">
          {error}
        </Banner>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button
            variant="ghost"
            icon="chevronLeft"
            onClick={() => setStep(step - 1)}
          >
            Quay lại
          </Button>
        )}
        {step < 2 ? (
          <Button
            full
            disabled={step === 0 && !step1Valid}
            onClick={() => setStep(step + 1)}
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            full
            icon="check"
            disabled={!budgetValid}
            loading={saving}
            onClick={onFinish}
          >
            {saving ? "Đang lưu" : "Xong, vào bếp"}
          </Button>
        )}
      </div>
    </main>
  );
}
