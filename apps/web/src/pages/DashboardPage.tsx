import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StressTestResult, LoanEligibilityResult } from "@inseoul/shared-contracts";
import { runGoldenCross, runStressTest, checkLoanEligibility } from "../api";
import { useAuthStore } from "../store/authStore";
import { useSimulationStore } from "../store/simulationStore";
import { formatWon } from "../utils/formatWon";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import DisclaimerBadge from "../components/ui/DisclaimerBadge";

function buildChartData(
  cashAsset: number,
  jeonseDeposit: number,
  monthlySaving: number,
  targetPrice: number,
  expectedGrowthRate: number,
  dDayMonths: number,
) {
  const months = Math.min(dDayMonths + 12, 120);
  return Array.from({ length: months + 1 }, (_, t) => {
    const assetGrowth =
      cashAsset + jeonseDeposit + monthlySaving * t;
    const targetAt = targetPrice * Math.pow(1 + expectedGrowthRate, t / 12);
    return {
      month: t,
      자산: Math.round(assetGrowth / 10_000),
      목표가: Math.round(targetAt / 10_000),
    };
  });
}

const LOAN_STATUS_LABEL: Record<string, string> = {
  POSSIBLE: "가능",
  IMPOSSIBLE: "불가",
  NEED_MORE_INFO: "정보 부족",
};
const LOAN_STATUS_COLOR: Record<string, string> = {
  POSSIBLE: "text-green-700 bg-green-50",
  IMPOSSIBLE: "text-red-700 bg-red-50",
  NEED_MORE_INFO: "text-amber-700 bg-amber-50",
};

export default function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)!;
  const navigate = useNavigate();
  const { formInput, goldenCrossData, stressTestData, loanData, setGoldenCrossData, setStressTestData, setLoanData } =
    useSimulationStore();

  useEffect(() => {
    if (!formInput) navigate("/app/input");
  }, [formInput, navigate]);

  const gcQuery = useQuery({
    queryKey: ["golden-cross", formInput],
    queryFn: () => runGoldenCross(accessToken, formInput!),
    enabled: !!formInput && !goldenCrossData,
    staleTime: Infinity,
  });

  const simulationId = gcQuery.data?.simulationId ?? goldenCrossData?.simulationId;

  const stressQuery = useQuery({
    queryKey: ["stress-test", simulationId],
    queryFn: () => runStressTest(accessToken, simulationId!),
    enabled: !!simulationId && !stressTestData,
    staleTime: Infinity,
  });

  const loanQuery = useQuery({
    queryKey: ["loan-eligibility", formInput?.targetPrice],
    queryFn: () =>
      checkLoanEligibility(accessToken, {
        annualIncome: 0,
        targetPrice: formInput!.targetPrice,
        firstHomeBuyer: true,
      }),
    enabled: !!formInput && !loanData,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (gcQuery.data) setGoldenCrossData(gcQuery.data);
  }, [gcQuery.data, setGoldenCrossData]);
  useEffect(() => {
    if (stressQuery.data) setStressTestData(stressQuery.data);
  }, [stressQuery.data, setStressTestData]);
  useEffect(() => {
    if (loanQuery.data) setLoanData(loanQuery.data);
  }, [loanQuery.data, setLoanData]);

  const gc = goldenCrossData ?? gcQuery.data;
  const stress = stressTestData ?? stressQuery.data;
  const loan = loanData ?? loanQuery.data;

  if (!formInput) return null;

  const isLoading = gcQuery.isLoading || stressQuery.isLoading || loanQuery.isLoading;
  const error = gcQuery.error ?? stressQuery.error ?? loanQuery.error;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Spinner />
        <p className="text-sm text-gray-500">시뮬레이션 계산 중...</p>
      </div>
    );
  }

  if (error || !gc) {
    return <ErrorBanner message={error instanceof Error ? error.message : "시뮬레이션 실패"} />;
  }

  const chartData = buildChartData(
    formInput.cashAsset,
    formInput.jeonseDeposit,
    formInput.monthlySaving,
    formInput.targetPrice,
    formInput.expectedGrowthRate,
    gc.dDayMonths,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">시뮬레이션 결과</h1>
        <Button variant="secondary" onClick={() => navigate("/app/input")}>
          재입력
        </Button>
      </div>

      {/* D-Day 카드 */}
      <Card className="text-center py-8">
        <p className="text-sm text-gray-500 mb-2">예상 매수 D-Day</p>
        <p className="text-5xl font-extrabold text-blue-600">
          {gc.dDayMonths != null ? `${gc.dDayMonths}개월` : "달성 불가"}
        </p>
        <p className="text-sm text-gray-400 mt-3">{gc.message}</p>
        <div className="mt-4 flex justify-center gap-8 text-sm">
          <div>
            <p className="text-gray-500">필요 자본</p>
            <p className="font-semibold">{formatWon(gc.requiredCapital)}</p>
          </div>
          <div>
            <p className="text-gray-500">예상 시점 가격</p>
            <p className="font-semibold">{formatWon(gc.targetPriceAtPurchase)}</p>
          </div>
        </div>
      </Card>

      {/* 골든크로스 차트 */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">자산 vs 목표가 추이 (만원)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(v) => `${v}M`} />
            <YAxis tickFormatter={(v) => `${(v / 10_000).toFixed(0)}억`} />
            <Tooltip formatter={(v) => `${(v as number).toLocaleString()}만원`} />
            <Legend />
            <Line type="monotone" dataKey="자산" stroke="#2563eb" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="목표가" stroke="#dc2626" dot={false} strokeWidth={2} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 스트레스 테스트 */}
      {stress && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">스트레스 테스트</h2>
          <div className="divide-y divide-gray-100">
            {stress.results.map((r: StressTestResult) => (
              <div key={r.scenarioType} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">
                  {{
                    INTEREST_RATE_UP: "금리 +1%p",
                    PRICE_UP: "집값 +2%p",
                    SAVING_DOWN: "저축 -10%",
                    SAVING_UP: "저축 +10%",
                  }[r.scenarioType] ?? r.scenarioType}
                </span>
                <span className={r.delayedMonths >= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                  {r.delayedMonths >= 0 ? `+${r.delayedMonths}개월` : `${r.delayedMonths}개월`}
                  {" "}→ {r.resultDDayMonths}M
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 정책대출 판정 */}
      {loan && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">정책대출 적격 여부</h2>
          <div className="space-y-2">
            {loan.results.map((r: LoanEligibilityResult) => (
              <div key={r.loanName} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-block rounded px-2 py-0.5 text-xs font-medium ${LOAN_STATUS_COLOR[r.status] ?? ""}`}
                >
                  {LOAN_STATUS_LABEL[r.status] ?? r.status}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.loanName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 전략 카드 */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={() => navigate("/app/strategy-card")}
          disabled={!gc.simulationId}
        >
          AI 전략 카드 생성
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/app/strategy-select")}
        >
          전략 비교
        </Button>
      </div>

      <DisclaimerBadge />
    </div>
  );
}
