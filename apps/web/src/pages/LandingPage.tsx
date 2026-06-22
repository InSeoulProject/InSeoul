import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-3">InSeoul</h1>
      <p className="text-lg text-gray-500 mb-2">서울 아파트 매수 타이밍 시뮬레이터</p>
      <p className="text-sm text-gray-400 mb-10">내 자산과 목표 지역을 입력하면 AI가 최적의 매수 D-Day를 분석해 드립니다.</p>
      <div className="flex gap-3">
        <Button onClick={() => navigate("/signup")} className="px-6 py-3 text-base">
          시작하기
        </Button>
        <Button variant="secondary" onClick={() => navigate("/login")} className="px-6 py-3 text-base">
          로그인
        </Button>
      </div>
      <ul className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl w-full">
        {[
          { icon: "📊", title: "D-Day 계산", desc: "골든크로스 공식으로 정확한 매수 시점 산출" },
          { icon: "🏦", title: "정책대출 판정", desc: "보금자리론·디딤돌 등 4개 상품 자동 적격 여부 확인" },
          { icon: "🤖", title: "AI 전략 카드", desc: "시뮬레이션 결과 기반 맞춤 전략 리포트" },
        ].map((f) => (
          <li key={f.title} className="rounded-2xl bg-white p-5 shadow-sm">
            <span className="text-2xl">{f.icon}</span>
            <p className="font-semibold mt-2 text-sm text-gray-800">{f.title}</p>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
