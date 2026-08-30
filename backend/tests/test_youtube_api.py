from fastapi.testclient import TestClient

from app.main import app
from app.api.youtube import get_youtube_service
from app.schemas.youtube import ChannelInfo, Comment, CommentAnalysis, FinalInsight, VideoInfo
from app.services.gemini_service import get_gemini_service


class FakeYouTubeService:
    async def get_channel_info(self, **_: str | None) -> ChannelInfo:
        return ChannelInfo(id="UC1", title="Example", thumbnail=None, uploads_playlist_id="UU1")


def test_resolve_endpoint_returns_channel_metadata() -> None:
    app.dependency_overrides[get_youtube_service] = lambda: FakeYouTubeService()
    try:
        response = TestClient(app).post("/api/youtube/resolve", json={"url": "https://youtube.com/@example"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "targetType": "channel",
        "target": {"id": "UC1", "title": "Example", "thumbnail": None, "uploadsPlaylistId": "UU1"},
    }


class FakeCommentService:
    async def get_video_info(self, _: str) -> VideoInfo:
        return VideoInfo(id="video1", title="Video", thumbnail=None, channel_id="UC1", channel_title="Channel", published_at="2026-01-01T00:00:00Z")

    async def get_video_comments(self, video_id: str, max_comments: int, video_title: str, owner_channel_id: str) -> list[Comment]:
        assert max_comments == 100
        assert owner_channel_id == "UC1"
        return [Comment(id="comment1", video_id=video_id, video_title=video_title, text="Hello", like_count=2, published_at="2026-01-01T00:00:00Z")]


def test_comments_endpoint_returns_video_comments() -> None:
    app.dependency_overrides[get_youtube_service] = lambda: FakeCommentService()
    try:
        response = TestClient(app).post("/api/youtube/comments", json={"url": "https://youtu.be/video1"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["comments"] == [{"id": "comment1", "videoId": "video1", "videoTitle": "Video", "text": "Hello", "likeCount": 2, "publishedAt": "2026-01-01T00:00:00Z"}]


class FakeGeminiService:
    async def analyze_batch(self, comments):
        return [CommentAnalysis(id=comment.id, category="positive", topic=None, sentiment="positive") for comment in comments]

    async def generate_final_insight(self, _):
        return FinalInsight(summary="긍정적인 반응입니다.", top_requests=[], top_complaints=[], content_ideas=[])


def test_analyze_endpoint_returns_validated_comment_analyses() -> None:
    app.dependency_overrides[get_youtube_service] = lambda: FakeCommentService()
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = TestClient(app).post("/api/youtube/comments/analyze", json={"url": "https://youtu.be/video1"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["analysisResults"] == [{"id": "comment1", "category": "positive", "topic": None, "sentiment": "positive"}]
    assert response.json()["categories"]["positive"] == 1
    assert response.json()["categories"]["spam"] == 0
    assert response.json()["topics"] == []
    assert response.json()["insight"]["summary"] == "긍정적인 반응입니다."


def test_final_analyze_endpoint_returns_dashboard_ready_response() -> None:
    app.dependency_overrides[get_youtube_service] = lambda: FakeCommentService()
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    try:
        response = TestClient(app).post("/api/analyze", json={"url": "https://youtu.be/video1"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "targetType": "video",
        "target": {"id": "video1", "title": "Video", "thumbnail": None, "channelId": "UC1", "channelTitle": "Channel", "publishedAt": "2026-01-01T00:00:00Z"},
        "totalComments": 1,
        "categories": {"positive": 1, "question": 0, "content_request": 0, "complaint": 0, "toxic": 0, "spam": 0, "other": 0},
        "topRequests": [],
        "topComplaints": [],
        "summary": "긍정적인 반응입니다.",
        "contentIdeas": [],
        "analyzedVideoCount": None,
    }
