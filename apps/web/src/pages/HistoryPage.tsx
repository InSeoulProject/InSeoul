import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSimulationHistory } from "../api";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
import type { SimulationHistoryItem } from "@inseoul/shared-contracts";

export default function HistoryPage() {
  const accessToken = useAuthStore((s) => s.accessToken)!;
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["simulation-history"],
    queryFn: () => getSimulationHistory(accessToken),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (error) return <ErrorBanner message="이력을 불러오지 못했습니다." />;

  const items = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">시뮬레이션 이력</h1>
        <Button variant="secondary" onClick={() => navigate("/app/input")}>
          새 시뮬레이션
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">아직 시뮬레이션 이력이 없습니다.</p>
          <Button className="mt-4" onClick={() => navigate("/app/input")}>시작하기</Button>
        </Card>
      ) : (
        items.map((item: SimulationHistoryItem) => (
          <Card key={item.simulationId} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{item.targetDistrict ?? "지역 미설정"}</p>
              <p className="text-sm text-gray-500 mt-1">
                D-Day:{" "}
                {item.dDayMonths != null
                  ? `약 ${item.dDayMonths}개월 후`
                  : "달성 불가"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(item.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
