import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { GoldenCrossRequest } from "@inseoul/shared-contracts";
import { getDistrictPrices } from "../api";
import { useSimulationStore } from "../store/simulationStore";
import { wonToMan } from "../utils/formatWon";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import WonInput from "../components/ui/WonInput";
import Input from "../components/ui/Input";

type ConfirmForm = {
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

export default function ConfirmPage() {
  const navigate = useNavigate();
  const { parsedInput, setFormInput } = useSimulationStore();
  const { data: districts } = useQuery({
    queryKey: ["district-prices"],
    queryFn: () => getDistrictPrices(),
    staleTime: Infinity,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ConfirmForm>({
    defaultValues: {
      cashAsset: parsedInput?.cashAsset ? parsedInput.cashAsset / 10_000 : undefined,
      jeonseDeposit: parsedInput?.jeonseDeposit ? parsedInput.jeonseDeposit / 10_000 : undefined,
      monthlySaving: parsedInput?.monthlySaving ? parsedInput.monthlySaving / 10_000 : undefined,
      targetDistrict: parsedInput?.targetDistrict ?? "",
      targetPrice: parsedInput?.targetPrice ? parsedInput.targetPrice / 10_000 : undefined,
      ltv: 70,
      interestRate: 4,
      expectedGrowthRate: 3,
      acquisitionTaxRate: 1.1,
    },
  });

  if (!parsedInput) {
    navigate("/app/input");
    return null;
  }

  const onSubmit = (data: ConfirmForm) => {
    const req: GoldenCrossRequest = {
      cashAsset: data.cashAsset * 10_000,
      jeonseDeposit: data.jeonseDeposit * 10_000,
      monthlySaving: data.monthlySaving * 10_000,
      targetDistrict: data.targetDistrict,
      targetPrice: data.targetPrice * 10_000,
      ltv: data.ltv / 100,
      interestRate: data.interestRate / 100,
      expectedGrowthRate: data.expectedGrowthRate / 100,
      acquisitionTaxRate: data.acquisitionTaxRate / 100,
    };
    setFormInput(req);
    navigate("/app/dashboard");
  };

  const missing = parsedInput.missingFields;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">조건 확인</h1>

      {missing.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          AI가 추출하지 못한 항목이 있습니다. 직접 입력해주세요:{" "}
          <strong>{missing.join(", ")}</strong>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <WonInput
              label="현금 자산 (만원)"
              error={errors.cashAsset?.message}
              {...register("cashAsset", { required: "필수", valueAsNumber: true, min: { value: 0, message: "0 이상" } })}
            />
            <WonInput
              label="전세보증금 (만원)"
              error={errors.jeonseDeposit?.message}
              {...register("jeonseDeposit", { required: "필수", valueAsNumber: true, min: { value: 0, message: "0 이상" } })}
            />
            <WonInput
              label="월 저축액 (만원)"
              error={errors.monthlySaving?.message}
              {...register("monthlySaving", { required: "필수", valueAsNumber: true, min: { value: 0, message: "0 이상" } })}
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
              {...register("targetPrice", { required: "필수", valueAsNumber: true, min: { value: 1, message: "1 이상" } })}
            />
            <Input
              label="LTV (%)"
              type="number"
              step="1"
              error={errors.ltv?.message}
              {...register("ltv", { required: "필수", valueAsNumber: true })}
            />
            <Input
              label="연 금리 (%)"
              type="number"
              step="0.1"
              error={errors.interestRate?.message}
              {...register("interestRate", { required: "필수", valueAsNumber: true })}
            />
            <Input
              label="연간 가격상승률 (%)"
              type="number"
              step="0.1"
              error={errors.expectedGrowthRate?.message}
              {...register("expectedGrowthRate", { required: "필수", valueAsNumber: true })}
            />
            <Input
              label="취득세율 (%)"
              type="number"
              step="0.01"
              error={errors.acquisitionTaxRate?.message}
              {...register("acquisitionTaxRate", { required: "필수", valueAsNumber: true })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => navigate("/app/input")}>
              다시 입력
            </Button>
            <Button type="submit" className="flex-1">
              시뮬레이션 실행
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
