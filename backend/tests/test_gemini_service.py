import json

import httpx
import pytest

from app.schemas.youtube import AnalysisComment, ChannelInfo, ChannelInsightInput, ChannelVideo, InsightInput, TargetType
from app.services.gemini_service import (
    GeminiResponseValidationError,
    GeminiService,
    _build_channel_insight_prompt,
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
    async def handler(request: httpx.Request) -> httpx.Response:
        schema = json.loads(request.content)["generationConfig"]["responseSchema"]
        assert schema["required"] == ["summary", "topRequests", "topComplaints", "contentIdeas"]
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": '{"summary":"시청자들이 비교 콘텐츠를 원합니다.","topRequests":[{"topic":"아이폰 비교","count":2}],"topComplaints":[],"contentIdeas":[{"title":"아이폰 비교 영상","reason":"비교 요청이 반복됨","sourceTopics":["아이폰 비교"]}]}' }]}}]})

    insight_input = InsightInput(target_type=TargetType.VIDEO, target_title="Video", total_comments=2, categories={"content_request": 2}, topics=[], request_topics=[], complaint_topics=[])
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        insight = await GeminiService("test-key", "gemini-test", client).generate_final_insight(insight_input)

    assert insight.top_requests[0].topic == "아이폰 비교"


@pytest.mark.asyncio
async def test_generates_structured_channel_insight_from_public_snapshot() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        schema = json.loads(request.content)["generationConfig"]["responseSchema"]
        assert schema["required"] == ["summary", "strengths", "opportunities"]
        return httpx.Response(
            200,
            json={"candidates": [{"content": {"parts": [{"text": '{"summary":"Recent public videos show a clear topic focus.","strengths":["One recent video has strong public engagement."],"opportunities":["Test a follow-up on the same topic."]}'}]}}]},
        )

    insight_input = ChannelInsightInput(
        channel=ChannelInfo(id="UC1", title="Example", uploads_playlist_id="UU1"),
        recent_videos=[
            ChannelVideo(id="video1", title="Example topic", published_at="2026-01-01T00:00:00Z", view_count=100, like_count=10, comment_count=2, duration_seconds=240),
            ChannelVideo(id="video2", title="Highest viewed topic", published_at="2026-01-02T00:00:00Z", view_count=250, like_count=20, comment_count=4, duration_seconds=90),
        ],
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        insight = await GeminiService("test-key", "gemini-test", client).generate_channel_insight(insight_input)

    assert insight.strengths == ["One recent video has strong public engagement."]
    assert insight.opportunities == ["Test a follow-up on the same topic."]
    prompt = _build_channel_insight_prompt(insight_input)
    assert "CTR" in prompt
    assert "추측하지 마세요" in prompt
    assert "최솟값·최댓값·범위" in prompt
    assert "단순 비교해 상승세나 하락세" in prompt
    assert "반복되는 주제" in prompt
    assert '반드시 "최근 영상 중"' in prompt
    assert '첫 문장은 반드시 "최근 영상에서는"' in prompt
    assert "최근 공개 영상" not in prompt
    assert "Example topic" in prompt
    assert '"format": "long_form"' in prompt
    assert '"duration_seconds"' not in prompt
    assert '"highest_viewed_recent_video"' in prompt
    assert "각각 한 편씩 사례를 고르지 마세요" in prompt
    assert "조회수 성과를 설명하는 항목은 최대 한 개" in prompt
    context = json.loads(prompt.split("입력 데이터:\n", maxsplit=1)[1])
    assert context["highest_viewed_recent_video"]["id"] == "video2"
    assert context["highest_viewed_recent_video"]["format"] == "shorts"


def test_classification_prompt_preserves_playful_comment_context() -> None:
    prompt = _build_classification_prompt([AnalysisComment(id="1", text="왜 처음부터 거길 보여줍니까 ㅋㅋ")])

    assert "playful reaction" in prompt
    assert "not complaint" in prompt
    assert "Never invent" in prompt
    assert "광고가 많음" in prompt
    assert 'explicitly mentions "광고"' in prompt
