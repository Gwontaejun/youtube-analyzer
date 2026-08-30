import { CategoryKey } from "../types";

const labels: Record<CategoryKey, string> = {
  positive: "긍정", question: "질문", content_request: "콘텐츠 요청", complaint: "불만", toxic: "악성", spam: "스팸", other: "기타",
};

export function AnalysisOverview({ categories }: { categories: Record<CategoryKey, number> }) {
  return <section className="dashboard-section"><div className="section-heading"><p className="eyebrow">OVERVIEW</p><h2>댓글 반응 요약</h2></div>
    <div className="overview-grid">{(Object.keys(labels) as CategoryKey[]).map((key) => <article key={key}><span>{labels[key]}</span><strong>{categories[key].toLocaleString()}</strong></article>)}</div>
  </section>;
}
