export function InsightSummary({ summary }: { summary: string }) {
  return <section className="dashboard-section insight-section"><p className="eyebrow">AI INSIGHT</p><h2>시청자 반응 인사이트</h2><p>{summary}</p></section>;
}
