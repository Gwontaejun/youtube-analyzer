type Props = { eyebrow: string; title: string };

export function SectionHeading({ eyebrow, title }: Props) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>;
}
