import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createStrategyCard } from "../api";
import { useAuthStore } from "../store/authStore";
import { useSimulationStore } from "../store/simulationStore";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import DisclaimerBadge from "../components/ui/DisclaimerBadge";

export default function StrategyCardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)!;
  const navigate = useNavigate();
  const { goldenCrossData, strategyCardData, setStrategyCardData } = useSimulationStore();

  const simulationId = goldenCrossData?.simulationId;

  const mutation = useMutation({
    mutationFn: () => createStrategyCard(accessToken, simulationId!),
    onSuccess: (data) => setStrategyCardData(data),
  });

  const card = strategyCardData;

  if (!simulationId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">시뮬레이션 결과가 없습니다.</p>
        <Button onClick={() => navigate("/app/input")}>입력 화면으로</Button>
      </div>
    );
  }

  if (!card && !mutation.isPending && !mutation.isError) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-1">AI 전략 카드 생성</p>
          <p className="text-sm text-gray-500">시뮬레이션 결과를 바탕으로 맞춤 전략을 분석합니다.</p>
        </div>
        <Button onClick={() => mutation.mutate()} className="px-8">
          생성하기
        </Button>
      </div>
    );
  }

  if (mutation.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Spinner />
        <p className="text-sm text-gray-500">AI가 전략을 분석하고 있습니다...</p>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="space-y-4">
        <ErrorBanner message="전략 카드 생성에 실패했습니다." />
        <Button onClick={() => mutation.mutate()}>다시 시도</Button>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">AI 전략 카드</h1>

      {/* 요약 */}
      <Card className="bg-blue-50 border-blue-100">
        <p className="text-base font-medium text-blue-900 leading-relaxed">{card.summary}</p>
      </Card>

      {/* 실행 항목 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">추천 실행 항목</h2>
        <ol className="space-y-2">
          {card.actionItems.map((item: string, i: number) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <Card className="flex-1 py-3 px-4 text-sm text-gray-700">{item}</Card>
            </li>
          ))}
        </ol>
      </div>

      {/* 면책 */}
      <DisclaimerBadge text={card.disclaimer} />

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate("/app/history")}>
          이력 보기
        </Button>
        <Button
          onClick={() => {
            useSimulationStore.getState().reset();
            navigate("/app/input");
          }}
          className="flex-1"
        >
          새 시뮬레이션
        </Button>
      </div>
    </div>
  );
}
