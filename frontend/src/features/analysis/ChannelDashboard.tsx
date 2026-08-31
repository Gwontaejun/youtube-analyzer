import { AnalysisResponse } from "../../types/analysis";
import { TargetHeader } from "./components/TargetHeader";

export function ChannelDashboard({ result, onReset }: { result: AnalysisResponse; onReset: () => void }) {
  return <main className="dashboard-shell channel-dashboard-pending">
    <TargetHeader result={result} onReset={onReset} />
    <section className="channel-pending-copy" aria-labelledby="channel-dashboard-pending-title">
      <p className="eyebrow">CHANNEL DASHBOARD</p>
      <h2 id="channel-dashboard-pending-title">채널 대시보드는 준비 중입니다.</h2>
      <p>채널 링크는 정상적으로 구분했습니다. 채널 전용 분석 화면은 별도로 설계한 뒤 제공하겠습니다.</p>
    </section>
  </main>;
}
