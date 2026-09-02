import asyncio
import json
from typing import Any

import httpx
from pydantic import TypeAdapter, ValidationError

from app.core.config import get_settings
from app.schemas.youtube import (
    AnalysisComment,
    ChannelInsight,
    ChannelInsightInput,
    CommentAnalysis,
    FinalInsight,
    InsightInput,
)


class GeminiServiceError(RuntimeError):
    pass


class GeminiResponseValidationError(GeminiServiceError):
    pass


class GeminiService:
    base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: str, model: str, client: httpx.AsyncClient | None = None) -> None:
        self.api_key = api_key
        self.model = model
        self.client = client

    async def analyze_batch(self, comments: list[AnalysisComment]) -> list[CommentAnalysis]:
        if not comments:
            return []

        response = await self._generate_content(_build_classification_prompt(comments), _analysis_response_schema())
        try:
            text = response["candidates"][0]["content"]["parts"][0]["text"]
            analyses = TypeAdapter(list[CommentAnalysis]).validate_json(text)
        except (KeyError, IndexError, TypeError, ValidationError) as error:
            raise GeminiResponseValidationError("Gemini returned an invalid analysis response") from error

        expected_ids = [comment.id for comment in comments]
        if len(analyses) != len(expected_ids) or {analysis.id for analysis in analyses} != set(expected_ids):
            raise GeminiResponseValidationError("Gemini returned incomplete analysis results")
        return analyses

    async def generate_final_insight(self, insight_input: InsightInput) -> FinalInsight:
        response = await self._generate_content(_build_insight_prompt(insight_input), _insight_response_schema())
        try:
            text = response["candidates"][0]["content"]["parts"][0]["text"]
            return FinalInsight.model_validate_json(text)
        except (KeyError, IndexError, TypeError, ValidationError) as error:
            raise GeminiResponseValidationError("Gemini returned an invalid insight response") from error

    async def generate_channel_insight(self, insight_input: ChannelInsightInput) -> ChannelInsight:
        response = await self._generate_content(
            _build_channel_insight_prompt(insight_input),
            _channel_insight_response_schema(),
        )
        try:
            text = response["candidates"][0]["content"]["parts"][0]["text"]
            return ChannelInsight.model_validate_json(text)
        except (KeyError, IndexError, TypeError, ValidationError) as error:
            raise GeminiResponseValidationError("Gemini returned an invalid channel insight response") from error

    async def _generate_content(self, prompt: str, response_schema: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
                "responseSchema": response_schema,
            },
        }
        url = f"{self.base_url}/{self.model}:generateContent"
        for attempt in range(2):
            response = await self._post(url, payload)
            if response.status_code < 400:
                return response.json()
            if response.status_code not in {429, 500, 502, 503, 504} or attempt == 1:
                raise GeminiServiceError("Gemini analysis request failed")
            await asyncio.sleep(1)
        raise GeminiServiceError("Gemini analysis request failed")

    async def _post(self, url: str, payload: dict[str, Any]) -> httpx.Response:
        if self.client:
            return await self.client.post(url, headers={"x-goog-api-key": self.api_key}, json=payload)
        async with httpx.AsyncClient(timeout=30) as client:
            return await client.post(url, headers={"x-goog-api-key": self.api_key}, json=payload)


def _build_classification_prompt(comments: list[AnalysisComment]) -> str:
    return """Classify every YouTube comment in the JSON array below. Return only a JSON array with one result for every input id.

Allowed categories:
- positive: praise, positive reaction, appreciation, or support.
- question: asks for information or clarification.
- content_request: asks for a future video topic, comparison, test, or follow-up content.
- complaint: dissatisfaction with the video or channel, including ads, length, editing, or explanation.
- toxic: harassment, personal attacks, insults, hate, malicious mockery, or aggressive hostile language. Judge context, not isolated words.
- spam: advertising, self-promotion, repeated promotional text, irrelevant links, or scams.
- other: no category clearly applies.

Tone and context rules:
- Do not classify playful exaggeration, friendly teasing, memes, surprise reactions, or humorous banter as complaint or toxic merely because the wording sounds critical.
- Laughter markers (for example ㅋㅋ, lol, emojis), playful phrasing, and familiar fan-community style can indicate a non-hostile reaction.
- For example, "왜 처음부터 거길 보여줍니까 ㅋㅋ" is a playful reaction and should normally be other with neutral or positive sentiment, not complaint.
- Use complaint only when the comment clearly expresses dissatisfaction or asks for an improvement; use toxic only for genuinely hostile or abusive intent.

Use exactly one category. Sentiment must be positive, neutral, or negative. Use a short, generalized Korean topic for questions, content requests, and complaints when possible; otherwise use null.

Topic grounding rules:
- Derive a topic only from information explicitly present in the comment. Never invent a video detail, product feature, or production issue.
- For example, "요즘 광고가 너무 많아서 몰입이 깨져요" must have the complaint topic "광고가 많음", not an unrelated topic such as subtitles or editing.
- If a complaint explicitly mentions "광고", the topic must be "광고가 많음". Do not substitute a different production issue.
- Use a broader normalized form when appropriate: requests to compare a specific iPhone and Galaxy are "스마트폰 비교"; questions about battery duration are "배터리 성능".

Input comments:
""" + json.dumps([comment.model_dump() for comment in comments], ensure_ascii=False)


def _build_insight_prompt(insight_input: InsightInput) -> str:
    context = json.dumps(insight_input.model_dump(), ensure_ascii=False)
    target_context = "최근 채널 전반의 시청자 반응" if insight_input.target_type.value == "channel" else "해당 영상에 대한 시청자 반응"
    return f"""당신은 YouTube 댓글 분석가입니다. 아래 집계 데이터만 사용해 {target_context}을 한국어로 인사이트화하세요.

비슷한 토픽은 자연스럽게 통합하되, 주어진 수치를 과장하거나 없는 사실을 만들지 마세요. summary는 2~4문장으로 작성합니다. topRequests에는 콘텐츠 요청이 있을 때만, topComplaints에는 불만이 있을 때만 포함합니다. contentIdeas는 근거가 충분할 때 최대 3개를 제안합니다. 각 contentIdeas의 sourceTopics에는 request_topics에서 실제로 사용한 토픽 문자열만 정확히 넣으세요.

집계 데이터:
{context}"""


def _build_channel_insight_prompt(insight_input: ChannelInsightInput) -> str:
    recent_videos = []
    for video in insight_input.recent_videos:
        video_context = video.model_dump(exclude={"duration_seconds"})
        video_context["format"] = "shorts" if 0 < video.duration_seconds <= 180 else "long_form"
        recent_videos.append(video_context)
    context = json.dumps(
        {
            "channel": insight_input.channel.model_dump(),
            "recent_videos": recent_videos,
            "highest_viewed_recent_video": max(
                recent_videos,
                key=lambda video: video["view_count"],
                default=None,
            ),
        },
        ensure_ascii=False,
    )
    return f"""당신은 YouTube 채널의 최근 콘텐츠 흐름을 분석하는 데이터 분석가입니다. 아래에 제공된 현재 시점의 공개 채널 정보와 최근 영상 데이터만 사용해 한국어 인사이트를 작성하세요.

반드시 지킬 규칙:
- summary의 첫 문장은 반드시 "최근 영상에서는" 또는 "최근 콘텐츠 기준으로"처럼 분석 범위가 최근 영상임을 밝히며 시작합니다.
- summary는 최근 콘텐츠에서 반복되는 주제, 포맷, 제목 패턴과 상대적으로 반응이 좋은 방향을 담은 2~3문장으로 작성하되, 개별 영상 제목을 여러 개 나열하지 마세요.
- strengths에는 최근 영상 목록에서 실제 반응이 확인된 콘텐츠 흐름을 1~2개의 짧고 구체적인 문장으로 작성합니다.
- opportunities에는 최근 흐름을 바탕으로 다음 영상에서 검증할 주제나 포맷을 1~3개의 짧고 구체적인 문장으로 작성합니다.
- 영상 제목, 조회수, 좋아요, 댓글, 영상 길이 등 입력에 실제로 있는 근거만 사용합니다.
- 각 영상의 format이 shorts이면 "숏츠", long_form이면 "롱폼"이라고 표현하세요.
- 영상 길이를 초나 분 단위로 풀어 쓰지 말고, 포맷 차이가 의미 있을 때만 "숏츠"와 "롱폼"으로 구분하세요.
- 롱폼과 숏츠에서 각각 한 편씩 사례를 고르지 마세요. 같은 조회수 성과를 설명하기 위한 것이라면 format과 관계없이 highest_viewed_recent_video 한 편만 대표 사례로 언급하세요.
- strengths에서 개별 영상의 조회수 성과를 설명하는 항목은 최대 한 개만 작성하세요. 나머지 항목이 필요하다면 또 다른 영상의 조회수가 아니라 반복되는 주제나 반응 패턴을 설명하세요.
- 롱폼과 숏츠 사이에 명확하고 서로 다른 반응 패턴이 확인되지 않으면 포맷을 굳이 구분하지 마세요.
- "180초 이하의 짧은 영상", "1000초 이상의 긴 콘텐츠", 영상 길이의 최솟값·최댓값·범위처럼 재생 시간을 나열하는 문장은 작성하지 마세요.
- 구독자 수, 누적 조회수, 공개 영상 수처럼 화면에 이미 표시되는 채널 기본 정보를 summary에서 그대로 반복하지 마세요.
- 단순히 "영상 길이가 다양하다", "여러 주제를 다룬다", "꾸준히 업로드한다"처럼 어느 채널에도 적용될 수 있는 문장을 작성하지 마세요.
- 조회수는 게시 후 누적 기간이 서로 다르므로 최신 영상과 오래된 영상의 수치를 단순 비교해 상승세나 하락세라고 판단하지 마세요.
- 과거 스냅샷이 없으므로 성장, 하락, 증가율, 기간별 추세를 주장하지 마세요.
- 공개 데이터로 알 수 없는 CTR, 시청 지속 시간, 유지율, 수익, 유입 경로, 시청자 인구통계를 추측하지 마세요.
- 일반적인 조언을 반복하지 말고, 입력에 있는 구체적인 영상 제목이나 반응 수치를 근거로 관찰을 설명하세요.
- 특정 영상의 조회수·좋아요·댓글이 상대적으로 높다고 설명할 때는 반드시 "최근 영상 중"이라는 비교 범위를 문장에 포함하세요. 채널 전체 기간의 성과처럼 표현하지 마세요.
- 데이터가 부족하면 부족하다고 명시하고 확정적으로 말하지 마세요.

입력 데이터:
{context}"""


def _analysis_response_schema() -> dict[str, Any]:
    return {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "id": {"type": "STRING"},
                "category": {"type": "STRING", "enum": ["positive", "question", "content_request", "complaint", "toxic", "spam", "other"]},
                "topic": {"type": "STRING", "nullable": True},
                "sentiment": {"type": "STRING", "enum": ["positive", "neutral", "negative"]},
            },
            "required": ["id", "category", "topic", "sentiment"],
        },
    }


def _insight_response_schema() -> dict[str, Any]:
    topic_schema = {
        "type": "OBJECT",
        "properties": {"topic": {"type": "STRING"}, "count": {"type": "INTEGER"}},
        "required": ["topic", "count"],
    }
    return {
        "type": "OBJECT",
        "properties": {
            "summary": {"type": "STRING"},
            "topRequests": {"type": "ARRAY", "items": topic_schema},
            "topComplaints": {"type": "ARRAY", "items": topic_schema},
            "contentIdeas": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING"},
                        "reason": {"type": "STRING"},
                        "sourceTopics": {"type": "ARRAY", "items": {"type": "STRING"}},
                    },
                    "required": ["title", "reason", "sourceTopics"],
                },
            },
        },
        "required": ["summary", "topRequests", "topComplaints", "contentIdeas"],
    }


def _channel_insight_response_schema() -> dict[str, Any]:
    return {
        "type": "OBJECT",
        "properties": {
            "summary": {"type": "STRING"},
            "strengths": {"type": "ARRAY", "items": {"type": "STRING"}},
            "opportunities": {"type": "ARRAY", "items": {"type": "STRING"}},
        },
        "required": ["summary", "strengths", "opportunities"],
    }


def get_gemini_service() -> GeminiService:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiServiceError("Gemini API key is not configured")
    return GeminiService(settings.gemini_api_key, settings.gemini_model)
