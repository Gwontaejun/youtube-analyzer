from collections import Counter

from app.schemas.youtube import (
    CommentAnalysis,
    CommentCategory,
    CommentExcerpt,
    ContentIdea,
    FinalInsight,
    TopicCount,
    TopicEvidence,
)


def aggregate_analyses(
    analyses: list[CommentAnalysis], comment_text_by_id: dict[str, str]
) -> tuple[dict[str, int], list[TopicEvidence]]:
    category_counts = Counter(analysis.category.value for analysis in analyses)
    categories = {category.value: category_counts[category.value] for category in CommentCategory}
    topics = aggregate_topics(analyses, comment_text_by_id=comment_text_by_id)
    return categories, topics


def aggregate_topics(
    analyses: list[CommentAnalysis],
    categories: set[CommentCategory] | None = None,
    comment_text_by_id: dict[str, str] | None = None,
    evidence_limit: int = 3,
) -> list[TopicEvidence]:
    grouped: dict[str, list[CommentAnalysis]] = {}
    for analysis in analyses:
        if analysis.topic and (categories is None or analysis.category in categories):
            grouped.setdefault(analysis.topic, []).append(analysis)

    topics = [
        TopicEvidence(
            topic=topic,
            count=len(topic_analyses),
            evidence_comments=[
                CommentExcerpt(id=analysis.id, text=comment_text_by_id[analysis.id])
                for analysis in topic_analyses[:evidence_limit]
                if comment_text_by_id and analysis.id in comment_text_by_id
            ],
        )
        for topic, topic_analyses in grouped.items()
    ]
    topics.sort(key=lambda item: (-item.count, item.topic.casefold()))
    return topics


def without_evidence(topics: list[TopicEvidence]) -> list[TopicCount]:
    return [TopicCount(topic=topic.topic, count=topic.count) for topic in topics]


def attach_content_idea_evidence(
    insight: FinalInsight, topic_evidence: list[TopicEvidence], evidence_limit: int = 3
) -> FinalInsight:
    evidence_by_topic = {topic.topic: topic.evidence_comments for topic in topic_evidence}
    content_ideas: list[ContentIdea] = []
    for idea in insight.content_ideas:
        comments: list[CommentExcerpt] = []
        seen_ids: set[str] = set()
        for topic in idea.source_topics:
            for comment in evidence_by_topic.get(topic, []):
                if comment.id not in seen_ids and len(comments) < evidence_limit:
                    comments.append(comment)
                    seen_ids.add(comment.id)
        content_ideas.append(idea.model_copy(update={"evidence_comments": comments}))
    return insight.model_copy(update={"content_ideas": content_ideas})
