import { SectionHeading } from "../../../components/SectionHeading";
import { categoryItems } from "../../../data/category-labels";
import { CategoryKey } from "../../../types/analysis";

export function AnalysisOverview({ categories }: { categories: Record<CategoryKey, number> }) {
  const total = Math.max(1, Object.values(categories).reduce((sum, value) => sum + value, 0));

  return <section className="overview-section"><SectionHeading eyebrow="COMMENT SIGNALS" title="댓글 반응" />
    <div className="overview-grid">{categoryItems.map(({ key, label, emoji }) => <article className={`category-card category-${key}`} key={key}><span className="category-emoji" aria-hidden="true">{emoji}</span><span className="category-label">{label}</span><strong>{categories[key].toLocaleString()}</strong><small>{Math.round((categories[key] / total) * 100)}%</small></article>)}</div>
  </section>;
}
