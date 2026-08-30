import { CategoryKey } from "../types";

const labels: Record<CategoryKey, string> = {
  positive: "긍정", question: "질문", content_request: "콘텐츠 요청", complaint: "불만", toxic: "악성", spam: "스팸", other: "기타",
};

export function CategoryChart({ categories }: { categories: Record<CategoryKey, number> }) {
  const total = Math.max(1, Object.values(categories).reduce((sum, value) => sum + value, 0));
  return <section className="dashboard-section chart-section"><div className="section-heading"><p className="eyebrow">DISTRIBUTION</p><h2>카테고리 분포</h2></div>
    <div className="category-chart">{(Object.keys(labels) as CategoryKey[]).map((key) => <div className="chart-row" key={key}><span>{labels[key]}</span><div className="chart-track"><i style={{ width: `${(categories[key] / total) * 100}%` }} /></div><strong>{Math.round((categories[key] / total) * 100)}%</strong></div>)}</div>
  </section>;
}
