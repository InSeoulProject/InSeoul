export default function DisclaimerBadge({ text }: { text?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-400 italic">
      {text ?? "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다."}
    </div>
  );
}
