from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.youtube import AnalyzeResponse, ChannelInsightInput, CollectCommentsRequest, CommentCategory, TargetType
from app.services.analysis_pipeline import analyze_target
from app.services.gemini_service import GeminiResponseValidationError, GeminiService, GeminiServiceError, get_gemini_service
from app.services.youtube_service import YouTubeCommentsUnavailableError, YouTubeNotFoundError, YouTubeService, YouTubeServiceError, get_youtube_service
from app.services.youtube_target import InvalidYouTubeUrl, detect_youtube_target

router = APIRouter(tags=["analysis"])


@router.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: CollectCommentsRequest,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> AnalyzeResponse:
    try:
        target = detect_youtube_target(str(request.url))
        if target.target_type is TargetType.CHANNEL:
            channel = await youtube_service.get_channel_info(
                channel_id=target.channel_id,
                handle=target.handle,
            )
            recent_videos = await youtube_service.get_recent_channel_videos(channel.uploads_playlist_id)
            channel_insight = await gemini_service.generate_channel_insight(
                ChannelInsightInput(channel=channel, recent_videos=recent_videos[:12])
            )
            return AnalyzeResponse(
                target_type=TargetType.CHANNEL,
                target=channel,
                total_comments=0,
                categories={category.value: 0 for category in CommentCategory},
                top_requests=[],
                top_complaints=[],
                summary="",
                content_ideas=[],
                analyzed_video_count=None,
                recent_videos=recent_videos,
                channel_insight=channel_insight,
            )
        result = await analyze_target(request, youtube_service, gemini_service)
        return AnalyzeResponse(
            target_type=result.target_type,
            target=result.target,
            total_comments=len(result.analysis_results),
            categories=result.categories,
            top_requests=result.insight.top_requests,
            top_complaints=result.insight.top_complaints,
            summary=result.insight.summary,
            content_ideas=result.insight.content_ideas,
            analyzed_video_count=result.analyzed_video_count,
            recent_videos=[],
        )
    except InvalidYouTubeUrl as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except YouTubeNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except YouTubeCommentsUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except GeminiResponseValidationError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Gemini returned an invalid analysis response") from error
    except (YouTubeServiceError, GeminiServiceError) as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to analyze YouTube data") from error
