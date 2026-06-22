import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { GoldenCrossData, GoldenCrossRequest } from "@inseoul/shared-contracts";
import { runGoldenCross } from "../api";
import { useAuthStore } from "../store/authStore";
import { useSimulationStore } from "../store/simulationStore";
import { formatWon } from "../utils/formatWon";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import DisclaimerBadge from "../components/ui/DisclaimerBadge";

type StrategyVariant = {
  id: string;
  title: string;
  description: string;
  modify: (req: GoldenCrossRequest) => GoldenCrossRequest;
};

const STRATEGIES: StrategyVariant[] = [
  {
    id: "fast",
    title: "빠른 매수",
    description: "LTV를 최대로 활용해 자기자본 부담을 줄입니다.",
    modify: (req) => ({ ...req, ltv: Math.min(req.ltv + 0.1, 0.9) }),
  },
  {
    id: "stable",
    title: "안정 준비",
    description: "집값 상승률을 보수적으로 가정해 안정적 준비 기간을 산출합니다.",
    modify: (req) => ({ ...req, expectedGrowthRate: Math.max(req.expectedGrowthRate - 0.01, 0) }),
  },
  {
    id: "policy",
    title: "정책대출 우선",
    description: "정책대출 가능 기준 이하 금리로 시뮬레이션합니다.",
    modify: (req) => ({ ...req, interestRate: Math.min(req.interestRate, 0.029) }),
  },
  {
    id: "district",
    title: "목표 지역 조정",
    description: "목표 매수가를 5% 낮춰 더 빠른 달성 가능성을 확인합니다.",
    modify: (req) => ({ ...req, targetPrice: req.targetPrice * 0.95 }),
  },
];

type VariantResult = { id: string; data: GoldenCrossData | null; diff: number | null; error: boolean };

export default function StrategySelectPage() {
  const accessToken = useAuthStore((s) => s.accessToken)!;
  const navigate = useNavigate();
  const { formInput, goldenCrossData } = useSimulationStore();
  const [results, setResults] = useState<Record<string, VariantResult>>({});

  const baseDDay = goldenCrossData?.dDayMonths ?? null;

  const mutation = useMutation({
    mutationFn: async (variant: StrategyVariant) => {
      if (!formInput) throw new Error("입력 없음");
      const modified = variant.modify(formInput);
      const data = await runGoldenCross(accessToken, modified);
      return { id: variant.id, data };
    },
    onSuccess: ({ id, data }) => {
      setResults((prev) => ({
        ...prev,
        [id]: {
          id,
          data,
          diff: baseDDay != null && data.dDayMonths != null ? data.dDayMonths - baseDDay : null,
          error: false,
        },
      }));
    },
    onError: (_err, variant) => {
      setResults((prev) => ({ ...prev, [variant.id]: { id: variant.id, data: null, diff: null, error: true } }));
    },
  });

  if (!formInput) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">시뮬레이션 결과가 없습니다.</p>
        <Button onClick={() => navigate("/app/input")}>입력 화면으로</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">전략 비교</h1>

      {baseDDay != null && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
          기준 D-Day: <strong>{baseDDay}개월</strong>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STRATEGIES.map((s) => {
          const r = results[s.id];
          const isPending = mutation.isPending && mutation.variables?.id === s.id;

          return (
            <Card key={s.id} className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </div>

              {isPending ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Spinner className="w-4 h-4" />
                  <span>계산 중...</span>
                </div>
              ) : r?.data ? (
                <div className="text-sm">
                  <span className="font-bold text-blue-700">{r.data.dDayMonths}개월</span>
                  {r.diff != null && (
                    <span
                      className={`ml-2 text-xs font-medium ${
                        r.diff < 0 ? "text-green-600" : r.diff > 0 ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      {r.diff === 0 ? "변동 없음" : r.diff > 0 ? `+${r.diff}M` : `${r.diff}M`}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    목표가 {formatWon(r.data.targetPriceAtPurchase)}
                  </p>
                </div>
              ) : r?.error ? (
                <p className="text-xs text-red-500">계산 실패</p>
              ) : null}

              <Button
                variant="secondary"
                onClick={() => mutation.mutate(s)}
                disabled={isPending}
              >
                재계산
              </Button>
            </Card>
          );
        })}
      </div>

      <Button variant="ghost" onClick={() => navigate("/app/dashboard")}>
        대시보드로 돌아가기
      </Button>

      <DisclaimerBadge />
    </div>
  );
}
