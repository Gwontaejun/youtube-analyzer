import { TopicCount } from "../types";

export function TopicList({ title, eyebrow, topics }: { title: string; eyebrow: string; topics: TopicCount[] }) {
  return <section className="dashboard-section topic-section"><div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
    {topics.length ? <ol className="topic-list">{topics.map((item) => <li key={item.topic}><span>{item.topic}</span><strong>{item.count}</strong></li>)}</ol> : <p className="empty-copy">뚜렷하게 반복된 항목이 없습니다.</p>}
  </section>;
}
