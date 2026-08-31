import asyncio
import json
from typing import Any

import httpx
from pydantic import TypeAdapter, ValidationError

from app.core.config import get_settings
from app.schemas.youtube import AnalysisComment, CommentAnalysis, FinalInsight, InsightInput


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


def get_gemini_service() -> GeminiService:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiServiceError("Gemini API key is not configured")
    return GeminiService(settings.gemini_api_key, settings.gemini_model)
