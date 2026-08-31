import { AnalysisResponse, VideoTarget } from "../../types/analysis";
import { AnalysisOverview } from "./components/AnalysisOverview";
import { ContentIdeas } from "./components/ContentIdeas";
import { InsightSummary } from "./components/InsightSummary";
import { TargetHeader } from "./components/TargetHeader";
import { TopicList } from "./components/TopicList";

type VideoAnalysisResponse = AnalysisResponse & { targetType: "video"; target: VideoTarget };

export function VideoDashboard({ result, onReset, onAnalyzeChannel }: { result: VideoAnalysisResponse; onReset: () => void; onAnalyzeChannel: (channelId: string) => void }) {
  return <main className="dashboard-shell">
    <TargetHeader result={result} onReset={onReset} onAnalyzeChannel={onAnalyzeChannel} />
    <AnalysisOverview categories={result.categories} />
    <InsightSummary summary={result.summary} />
    <div className="dashboard-two-column">
      <TopicList eyebrow="TOP REQUESTS" title="콘텐츠 요청 TOP" topics={result.topRequests} />
      <TopicList eyebrow="TOP COMPLAINTS" title="주요 불만 TOP" topics={result.topComplaints} />
    </div>
    <ContentIdeas ideas={result.contentIdeas} />
  </main>;
}
