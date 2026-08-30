import { ContentIdea } from "../types";

export function ContentIdeas({ ideas }: { ideas: ContentIdea[] }) {
  return <section className="dashboard-section ideas-section"><div className="section-heading"><p className="eyebrow">NEXT CONTENT</p><h2>다음 콘텐츠 아이디어</h2></div>
    {ideas.length ? <div className="idea-list">{ideas.map((idea) => <article key={idea.title}><h3>{idea.title}</h3><p>{idea.reason}</p>{idea.evidenceComments.length > 0 && <div className="evidence"><span>근거 댓글</span>{idea.evidenceComments.map((comment) => <q key={comment.id}>{comment.text}</q>)}</div>}</article>)}</div> : <p className="empty-copy">충분한 콘텐츠 요청이 쌓이면 아이디어를 제안합니다.</p>}
  </section>;
}
