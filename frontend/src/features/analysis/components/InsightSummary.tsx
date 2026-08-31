import { SectionHeading } from "../../../components/SectionHeading";

export function InsightSummary({ summary }: { summary: string }) {
  return <section className="insight-section"><SectionHeading eyebrow="AI INSIGHT" title="시청자 반응 인사이트" /><p>{summary}</p></section>;
}
