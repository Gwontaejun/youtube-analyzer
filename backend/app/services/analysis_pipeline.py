from dataclasses import dataclass

from app.schemas.youtube import (
    ChannelInfo,
    CollectCommentsRequest,
    Comment,
    CommentAnalysis,
    CommentCategory,
    FinalInsight,
    InsightInput,
    TargetType,
    TopicEvidence,
    VideoInfo,
)
from app.services.analysis_aggregation import (
    aggregate_analyses,
    aggregate_topics,
    attach_content_idea_evidence,
    without_evidence,
)
from app.services.comment_processing import create_batches, preprocess_comments
from app.services.gemini_service import GeminiService
from app.services.youtube_service import YouTubeService
from app.services.youtube_target import detect_youtube_target


@dataclass
class AnalysisPipelineResult:
    target_type: TargetType
    target: ChannelInfo | VideoInfo
    collected_comments: list[Comment]
    processed_comments: list[Comment]
    analysis_results: list[CommentAnalysis]
    categories: dict[str, int]
    topics: list[TopicEvidence]
    insight: FinalInsight
    analyzed_video_count: int | None


async def collect_target_comments(
    request: CollectCommentsRequest, service: YouTubeService
) -> tuple[TargetType, ChannelInfo | VideoInfo, list[Comment], int | None]:
    target = detect_youtube_target(str(request.url))
    if target.target_type is TargetType.VIDEO:
        info = await service.get_video_info(target.video_id or "")
        comments = await service.get_video_comments(
            info.id, request.max_comments, info.title, info.channel_id
        )
        return target.target_type, info, comments, None

    info = await service.get_channel_info(channel_id=target.channel_id, handle=target.handle)
    comments, analyzed_video_count = await service.collect_channel_comments(
        info.uploads_playlist_id, request.max_comments, info.id
    )
    return target.target_type, info, comments, analyzed_video_count


async def analyze_target(
    request: CollectCommentsRequest,
    youtube_service: YouTubeService,
    gemini_service: GeminiService,
) -> AnalysisPipelineResult:
    target_type, info, collected_comments, analyzed_video_count = await collect_target_comments(
        request, youtube_service
    )
    processed_comments = preprocess_comments(collected_comments)
    comment_text_by_id = {comment.id: comment.text for comment in processed_comments}
    analysis_results: list[CommentAnalysis] = []
    for batch in create_batches(processed_comments):
        analysis_results.extend(await gemini_service.analyze_batch(batch))

    categories, topics = aggregate_analyses(analysis_results, comment_text_by_id)
    insight = await _create_insight(
        target_type, info, analysis_results, categories, topics, comment_text_by_id, gemini_service
    )
    return AnalysisPipelineResult(
        target_type=target_type,
        target=info,
        collected_comments=collected_comments,
        processed_comments=processed_comments,
        analysis_results=analysis_results,
        categories=categories,
        topics=topics,
        insight=insight,
        analyzed_video_count=analyzed_video_count,
    )


async def _create_insight(
    target_type: TargetType,
    info: ChannelInfo | VideoInfo,
    analyses: list[CommentAnalysis],
    categories: dict[str, int],
    topics: list[TopicEvidence],
    comment_text_by_id: dict[str, str],
    gemini_service: GeminiService,
) -> FinalInsight:
    if not analyses:
        return FinalInsight(
            summary="분석할 일반 시청자 댓글이 없습니다.",
            top_requests=[],
            top_complaints=[],
            content_ideas=[],
        )

    request_topics = aggregate_topics(
        analyses, {CommentCategory.CONTENT_REQUEST}, comment_text_by_id
    )
    complaint_topics = aggregate_topics(
        analyses, {CommentCategory.COMPLAINT}, comment_text_by_id
    )
    insight = await gemini_service.generate_final_insight(InsightInput(
        target_type=target_type,
        target_title=info.title,
        total_comments=len(analyses),
        categories=categories,
        topics=without_evidence(topics[:20]),
        request_topics=without_evidence(request_topics[:20]),
        complaint_topics=without_evidence(complaint_topics[:20]),
    ))
    return attach_content_idea_evidence(insight, request_topics)
