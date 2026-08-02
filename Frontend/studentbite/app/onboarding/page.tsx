"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type ActivityLevel,
  type Goal,
  type IProfile,
} from "@/lib/types";

const STEPS = ["Thể trạng", "Mục tiêu", "Ngân sách"] as const;

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
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("MODERATE");
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
  const budgetValid = Number(monthlyBudget) >= 300000;

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
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Không thể lưu, thử lại sau",
      );
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base " +
    "outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${i <= step ? "bg-green-500" : "bg-gray-200"}`}
            />
            <p
              className={`mt-1.5 text-center text-[11px] ${
                i <= step ? "font-semibold text-green-600" : "text-gray-400"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <section className="flex-1 space-y-4">
          <h1 className="text-xl font-bold">Thể trạng của bạn 📏</h1>
          <p className="text-sm text-gray-500">
            Dùng để tính lượng calo và protein bạn cần mỗi ngày.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Chiều cao (cm)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="170"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Cân nặng (kg)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="65"
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Tuổi</label>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="20"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Giới tính
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`rounded-xl border py-3 text-sm font-medium ${
                      gender === g
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {g === "male" ? "Nam" : "Nữ"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Mức độ vận động
            </label>
            <div className="space-y-2">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setActivityLevel(lv)}
                  className={`block w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    activityLevel === lv
                      ? "border-green-500 bg-green-50 font-semibold text-green-700"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {ACTIVITY_LABELS[lv]}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="flex-1 space-y-4">
          <h1 className="text-xl font-bold">Mục tiêu của bạn 🎯</h1>
          <p className="text-sm text-gray-500">
            Quyết định lượng protein và calo mục tiêu mỗi ngày.
          </p>
          <div className="space-y-3">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`block w-full rounded-2xl border-2 px-5 py-4 text-left ${
                  goal === g
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-base font-semibold">
                  {GOAL_LABELS[g]}
                </span>
                <p className="mt-0.5 text-xs text-gray-500">
                  {g === "GAIN_MUSCLE" && "Protein 2g/kg, dư ~300 kcal/ngày"}
                  {g === "LOSE_FAT" && "Protein 2.2g/kg, hụt ~300 kcal/ngày"}
                  {g === "MAINTAIN" && "Protein 1.6g/kg, giữ nguyên calo"}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex-1 space-y-4">
          <h1 className="text-xl font-bold">Ngân sách ăn uống 💰</h1>
          <p className="text-sm text-gray-500">
            Tiền chu cấp/thu nhập dành cho ăn uống mỗi tháng. App sẽ chia đều
            theo ngày và từng bữa.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Ngân sách tháng (VND)
            </label>
            <input
              type="number"
              inputMode="numeric"
              step={100000}
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1500000, 2000000, 3000000, 4000000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMonthlyBudget(String(v))}
                className={`rounded-full border px-4 py-2 text-sm ${
                  Number(monthlyBudget) === v
                    ? "border-green-500 bg-green-50 font-semibold text-green-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {formatVnd(v)}
              </button>
            ))}
          </div>
          {budgetValid && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              ≈ {formatVnd(Number(monthlyBudget) / 30)}/ngày cho 4 bữa
            </p>
          )}
        </section>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3.5 font-medium text-gray-600"
          >
            Quay lại
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            disabled={step === 0 && !step1Valid}
            onClick={() => setStep(step + 1)}
            className="flex-1 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            Tiếp tục
          </button>
        ) : (
          <button
            type="button"
            disabled={!budgetValid || saving}
            onClick={onFinish}
            className="flex-1 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? "Đang lưu..." : "Hoàn tất 🎉"}
          </button>
        )}
      </div>
    </main>
  );
}
