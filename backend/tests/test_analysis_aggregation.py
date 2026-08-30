from app.schemas.youtube import CommentAnalysis, ContentIdea, FinalInsight
from app.services.analysis_aggregation import (
    aggregate_analyses,
    aggregate_topics,
    attach_content_idea_evidence,
)


def test_aggregates_all_categories_and_sorts_topics() -> None:
    analyses = [
        CommentAnalysis(id="1", category="positive", topic=None, sentiment="positive"),
        CommentAnalysis(id="2", category="content_request", topic="Battery test", sentiment="neutral"),
        CommentAnalysis(id="3", category="content_request", topic="iPhone comparison", sentiment="neutral"),
        CommentAnalysis(id="4", category="question", topic="Battery test", sentiment="neutral"),
    ]

    comments = {"1": "좋아요", "2": "배터리 테스트 해주세요", "3": "아이폰 비교 해주세요", "4": "배터리가 얼마나 가나요?"}
    categories, topics = aggregate_analyses(analyses, comments)

    assert categories == {
        "positive": 1,
        "question": 1,
        "content_request": 2,
        "complaint": 0,
        "toxic": 0,
        "spam": 0,
        "other": 0,
    }
    assert [topic.model_dump(by_alias=True) for topic in topics] == [
        {"topic": "Battery test", "count": 2, "evidenceComments": [{"id": "2", "text": "배터리 테스트 해주세요"}, {"id": "4", "text": "배터리가 얼마나 가나요?"}]},
        {"topic": "iPhone comparison", "count": 1, "evidenceComments": [{"id": "3", "text": "아이폰 비교 해주세요"}]},
    ]
    request_topics = aggregate_topics(analyses, {"content_request"}, comments)
    assert [topic.model_dump(by_alias=True) for topic in request_topics] == [
        {"topic": "Battery test", "count": 1, "evidenceComments": [{"id": "2", "text": "배터리 테스트 해주세요"}]},
        {"topic": "iPhone comparison", "count": 1, "evidenceComments": [{"id": "3", "text": "아이폰 비교 해주세요"}]},
    ]
    insight = FinalInsight(summary="요약", top_requests=[], top_complaints=[], content_ideas=[ContentIdea(title="배터리 영상", reason="요청", source_topics=["Battery test"])])
    enriched = attach_content_idea_evidence(insight, request_topics)
    assert enriched.content_ideas[0].evidence_comments[0].id == "2"
