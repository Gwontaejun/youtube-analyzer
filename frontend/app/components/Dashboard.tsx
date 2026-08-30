import { AnalysisResponse } from "../types";
import { AnalysisOverview } from "./AnalysisOverview";
import { CategoryChart } from "./CategoryChart";
import { ContentIdeas } from "./ContentIdeas";
import { InsightSummary } from "./InsightSummary";
import { TargetHeader } from "./TargetHeader";
import { TopicList } from "./TopicList";

export function Dashboard({ result, onReset }: { result: AnalysisResponse; onReset: () => void }) {
  return <main className="dashboard-shell"><TargetHeader result={result} onReset={onReset} />
    <AnalysisOverview categories={result.categories} />
    <div className="dashboard-two-column"><CategoryChart categories={result.categories} /><InsightSummary summary={result.summary} /></div>
    <div className="dashboard-two-column"><TopicList eyebrow="TOP REQUESTS" title="콘텐츠 요청 TOP" topics={result.topRequests} /><TopicList eyebrow="TOP COMPLAINTS" title="주요 불만 TOP" topics={result.topComplaints} /></div>
    <ContentIdeas ideas={result.contentIdeas} />
  </main>;
}
