from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.youtube import AnalyzeCommentsResponse, CollectCommentsRequest, CollectCommentsResponse, PrepareCommentsResponse, ResolveRequest, ResolveResponse, TargetType
from app.services.analysis_pipeline import analyze_target, collect_target_comments
from app.services.comment_processing import create_batches, preprocess_comments
from app.services.gemini_service import GeminiResponseValidationError, GeminiService, GeminiServiceError, get_gemini_service
from app.services.youtube_service import YouTubeCommentsUnavailableError, YouTubeNotFoundError, YouTubeService, YouTubeServiceError, get_youtube_service
from app.services.youtube_target import InvalidYouTubeUrl, detect_youtube_target

router = APIRouter(prefix="/api/youtube", tags=["youtube"])


@router.post("/resolve", response_model=ResolveResponse)
async def resolve_target(request: ResolveRequest, service: YouTubeService = Depends(get_youtube_service)) -> ResolveResponse:
    try:
        target = detect_youtube_target(str(request.url))
        info = await (service.get_video_info(target.video_id or "") if target.target_type is TargetType.VIDEO else service.get_channel_info(channel_id=target.channel_id, handle=target.handle))
        return ResolveResponse(target_type=target.target_type, target=info)
    except InvalidYouTubeUrl as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except YouTubeNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except YouTubeServiceError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to retrieve YouTube metadata") from error


@router.post("/comments", response_model=CollectCommentsResponse)
async def collect_comments(request: CollectCommentsRequest, service: YouTubeService = Depends(get_youtube_service)) -> CollectCommentsResponse:
    try:
        target_type, info, comments, analyzed_video_count = await collect_target_comments(request, service)
        return CollectCommentsResponse(target_type=target_type, target=info, comments=comments, analyzed_video_count=analyzed_video_count)
    except InvalidYouTubeUrl as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except YouTubeNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except YouTubeCommentsUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except YouTubeServiceError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to retrieve YouTube comments") from error


@router.post("/comments/prepare", response_model=PrepareCommentsResponse)
async def prepare_comments(request: CollectCommentsRequest, service: YouTubeService = Depends(get_youtube_service)) -> PrepareCommentsResponse:
    try:
        target_type, info, comments, analyzed_video_count = await collect_target_comments(request, service)
        processed_comments = preprocess_comments(comments)
        return PrepareCommentsResponse(
            target_type=target_type,
            target=info,
            collected_comment_count=len(comments),
            processed_comment_count=len(processed_comments),
            batches=create_batches(processed_comments),
            analyzed_video_count=analyzed_video_count,
        )
    except InvalidYouTubeUrl as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except YouTubeNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except YouTubeCommentsUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except YouTubeServiceError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to prepare YouTube comments") from error


@router.post("/comments/analyze", response_model=AnalyzeCommentsResponse)
async def analyze_comments(
    request: CollectCommentsRequest,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> AnalyzeCommentsResponse:
    try:
        result = await analyze_target(request, youtube_service, gemini_service)
        return AnalyzeCommentsResponse(
            target_type=result.target_type,
            target=result.target,
            collected_comment_count=len(result.collected_comments),
            processed_comment_count=len(result.processed_comments),
            analysis_results=result.analysis_results,
            categories=result.categories,
            topics=result.topics,
            insight=result.insight,
            analyzed_video_count=result.analyzed_video_count,
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
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to analyze YouTube comments") from error
