from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.youtube import AnalyzeResponse, CollectCommentsRequest
from app.services.analysis_pipeline import analyze_target
from app.services.gemini_service import GeminiResponseValidationError, GeminiService, GeminiServiceError, get_gemini_service
from app.services.youtube_service import YouTubeCommentsUnavailableError, YouTubeNotFoundError, YouTubeService, YouTubeServiceError, get_youtube_service
from app.services.youtube_target import InvalidYouTubeUrl

router = APIRouter(tags=["analysis"])


@router.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: CollectCommentsRequest,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> AnalyzeResponse:
    try:
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
