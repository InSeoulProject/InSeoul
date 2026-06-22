import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { GoldenCrossRequest } from "@inseoul/shared-contracts";
import { parseInput, getDistrictPrices } from "../api";
import { useAuthStore } from "../store/authStore";
import { useSimulationStore } from "../store/simulationStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";
import WonInput from "../components/ui/WonInput";
import { wonToMan } from "../utils/formatWon";

type Tab = "natural" | "manual";

type ManualForm = {
  cashAsset: number;
  jeonseDeposit: number;
  monthlySaving: number;
  targetDistrict: string;
  targetPrice: number;
  ltv: number;
  interestRate: number;
  expectedGrowthRate: number;
  acquisitionTaxRate: number;
};

export default function ConditionInputPage() {
  const accessToken = useAuthStore((s) => s.accessToken)!;
  const { setRawText, setParsedInput, setFormInput } = useSimulationStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("natural");
  const [naturalText, setNaturalText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const { data: districts } = useQuery({
    queryKey: ["district-prices"],
    queryFn: () => getDistrictPrices(),
    staleTime: Infinity,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ManualForm>({
    defaultValues: {
      ltv: 70,
      interestRate: 4,
      expectedGrowthRate: 3,
      acquisitionTaxRate: 1.1,
    },
  });

  const handleNaturalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      setRawText(naturalText);
      const parsed = await parseInput(accessToken, naturalText);
      setParsedInput(parsed);
      navigate("/app/confirm");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "파싱 중 오류가 발생했습니다.");
    } finally {
      setParsing(false);
    }
  };

  const handleManualSubmit = (data: ManualForm) => {
    const req: GoldenCrossRequest = {
      cashAsset: data.cashAsset,
      jeonseDeposit: data.jeonseDeposit,
      monthlySaving: data.monthlySaving,
      targetDistrict: data.targetDistrict,
      targetPrice: data.targetPrice,
      ltv: data.ltv / 100,
      interestRate: data.interestRate / 100,
      expectedGrowthRate: data.expectedGrowthRate / 100,
      acquisitionTaxRate: data.acquisitionTaxRate / 100,
    };
    setFormInput(req);
    navigate("/app/dashboard");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">조건 입력</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {(["natural", "manual"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "natural" ? "자연어 입력" : "직접 입력"}
          </button>
        ))}
      </div>

      {tab === "natural" ? (
        <Card>
          <form onSubmit={handleNaturalSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">
              예: "현금 5천만원, 전세보증금 2억, 월 150만원 저축. 마포구 9억 아파트 목표"
            </p>
            {parseError && <ErrorBanner message={parseError} />}
            <textarea
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              rows={4}
              placeholder="현재 자산 상황과 목표를 자유롭게 입력해주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button type="submit" loading={parsing} disabled={!naturalText.trim()} className="w-full">
              {parsing ? "분석 중..." : "AI 분석"}
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit(handleManualSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WonInput
                label="현금 자산 (만원)"
                error={errors.cashAsset?.message}
                {...register("cashAsset", {
                  required: "필수 항목입니다.",
                  min: { value: 0, message: "0 이상이어야 합니다." },
                  valueAsNumber: true,
                })}
              />
              <WonInput
                label="전세보증금 (만원)"
                error={errors.jeonseDeposit?.message}
                {...register("jeonseDeposit", {
                  required: "필수 항목입니다.",
                  min: { value: 0, message: "0 이상이어야 합니다." },
                  valueAsNumber: true,
                })}
              />
              <WonInput
                label="월 저축액 (만원)"
                error={errors.monthlySaving?.message}
                {...register("monthlySaving", {
                  required: "필수 항목입니다.",
                  min: { value: 0, message: "0 이상이어야 합니다." },
                  valueAsNumber: true,
                })}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">목표 지역</label>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register("targetDistrict", { required: "지역을 선택해주세요." })}
                >
                  <option value="">선택</option>
                  {districts?.map((d) => (
                    <option key={d.district} value={d.district}>
                      {d.district} (평균 {wonToMan(d.averagePrice).toLocaleString()}만원)
                    </option>
                  ))}
                </select>
                {errors.targetDistrict && (
                  <p className="text-xs text-red-500">{errors.targetDistrict.message}</p>
                )}
              </div>
              <WonInput
                label="목표 매수가 (만원)"
                error={errors.targetPrice?.message}
                {...register("targetPrice", {
                  required: "필수 항목입니다.",
                  min: { value: 1, message: "1 이상이어야 합니다." },
                  valueAsNumber: true,
                })}
              />
              <Input
                label="LTV (%)"
                type="number"
                step="1"
                error={errors.ltv?.message}
                {...register("ltv", {
                  required: "필수 항목입니다.",
                  min: { value: 0, message: "0~100" },
                  max: { value: 100, message: "0~100" },
                  valueAsNumber: true,
                })}
              />
              <Input
                label="연 금리 (%)"
                type="number"
                step="0.1"
                error={errors.interestRate?.message}
                {...register("interestRate", { required: "필수 항목입니다.", valueAsNumber: true })}
              />
              <Input
                label="연간 가격상승률 (%)"
                type="number"
                step="0.1"
                error={errors.expectedGrowthRate?.message}
                {...register("expectedGrowthRate", { required: "필수 항목입니다.", valueAsNumber: true })}
              />
              <Input
                label="취득세율 (%)"
                type="number"
                step="0.01"
                error={errors.acquisitionTaxRate?.message}
                {...register("acquisitionTaxRate", { required: "필수 항목입니다.", valueAsNumber: true })}
              />
            </div>
            <Button type="submit" className="w-full mt-2">
              시뮬레이션 실행
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
