import json

import httpx
import pytest

from app.schemas.youtube import AnalysisComment, InsightInput, TargetType
from app.services.gemini_service import (
    GeminiResponseValidationError,
    GeminiService,
    _build_classification_prompt,
)


@pytest.mark.asyncio
async def test_analyze_batch_uses_structured_json_and_validates_response() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "test-key"
        assert json.loads(request.content)["generationConfig"]["responseMimeType"] == "application/json"
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": '[{"id":"1","category":"question","topic":"battery test","sentiment":"neutral"}]'}]}}]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        analyses = await GeminiService("test-key", "gemini-test", client).analyze_batch([AnalysisComment(id="1", text="How is battery life?")])

    assert analyses[0].category == "question"
    assert analyses[0].topic == "battery test"


@pytest.mark.asyncio
async def test_analyze_batch_rejects_missing_or_wrong_comment_ids() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": '[{"id":"wrong","category":"other","topic":null,"sentiment":"neutral"}]'}]}}]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(GeminiResponseValidationError, match="incomplete"):
            await GeminiService("test-key", "gemini-test", client).analyze_batch([AnalysisComment(id="1", text="Hello")])


@pytest.mark.asyncio
async def test_generates_korean_final_insight() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": '{"summary":"시청자들이 비교 콘텐츠를 원합니다.","topRequests":[{"topic":"아이폰 비교","count":2}],"topComplaints":[],"contentIdeas":[{"title":"아이폰 비교 영상","reason":"비교 요청이 반복됨","sourceTopics":["아이폰 비교"]}]}' }]}}]})

    insight_input = InsightInput(target_type=TargetType.VIDEO, target_title="Video", total_comments=2, categories={"content_request": 2}, topics=[], request_topics=[], complaint_topics=[])
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        insight = await GeminiService("test-key", "gemini-test", client).generate_final_insight(insight_input)

    assert insight.top_requests[0].topic == "아이폰 비교"


def test_classification_prompt_preserves_playful_comment_context() -> None:
    prompt = _build_classification_prompt([AnalysisComment(id="1", text="왜 처음부터 거길 보여줍니까 ㅋㅋ")])

    assert "playful reaction" in prompt
    assert "not complaint" in prompt
    assert "Never invent" in prompt
    assert "광고가 많음" in prompt
    assert 'explicitly mentions "광고"' in prompt
