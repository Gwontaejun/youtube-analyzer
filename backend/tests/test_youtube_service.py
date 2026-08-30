import httpx
import pytest

from app.services.youtube_service import YouTubeCommentsUnavailableError, YouTubeService


@pytest.mark.asyncio
async def test_resolves_channel_handle() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["forHandle"] == "@example"
        return httpx.Response(200, json={"items": [{"id": "UC1", "snippet": {"title": "Example", "thumbnails": {"high": {"url": "https://image"}}}, "contentDetails": {"relatedPlaylists": {"uploads": "UU1"}}}]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        info = await YouTubeService("test-key", client).get_channel_info(handle="@example")
    assert info.id == "UC1"
    assert info.uploads_playlist_id == "UU1"


@pytest.mark.asyncio
async def test_resolves_video() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"items": [{"id": "video1", "snippet": {"title": "Video", "channelId": "UC1", "channelTitle": "Channel", "publishedAt": "2026-01-01T00:00:00Z", "thumbnails": {"default": {"url": "https://image"}}}}]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        info = await YouTubeService("test-key", client).get_video_info("video1")
    assert info.channel_title == "Channel"


@pytest.mark.asyncio
async def test_collects_comments_across_pages_up_to_limit() -> None:
    requests: list[str | None] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request.url.params.get("pageToken"))
        if request.url.params.get("pageToken") is None:
            return httpx.Response(200, json={"items": [_comment_item("first")], "nextPageToken": "next"})
        return httpx.Response(200, json={"items": [_comment_item("second")]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        comments = await YouTubeService("test-key", client).get_video_comments("video1", 2, "Video", "UC-owner")

    assert [comment.id for comment in comments] == ["first", "second"]
    assert requests == [None, "next"]


@pytest.mark.asyncio
async def test_channel_collection_skips_videos_with_disabled_comments() -> None:
    service = YouTubeService("test-key")

    async def recent_videos(_: str):
        yield "disabled", "Disabled"
        yield "available", "Available"

    requested_limits: list[int] = []

    async def comments(video_id: str, limit: int, title: str, __: str):
        requested_limits.append(limit)
        if video_id == "disabled":
            from app.services.youtube_service import YouTubeCommentsUnavailableError
            raise YouTubeCommentsUnavailableError("disabled")
        return [_comment_item_model("comment-1", video_id, title)]

    service.iter_recent_videos = recent_videos  # type: ignore[method-assign]
    service.get_video_comments = comments  # type: ignore[method-assign]
    collected, analyzed_count = await service.collect_channel_comments("UU1", 1, "UC-owner")

    assert [comment.id for comment in collected] == ["comment-1"]
    assert analyzed_count == 1
    assert requested_limits == [1, 1]


@pytest.mark.asyncio
async def test_channel_collection_caps_each_video_at_200_comments() -> None:
    service = YouTubeService("test-key")
    requested_limits: list[int] = []

    async def recent_videos(_: str):
        yield "video-a", "Video A"
        yield "video-b", "Video B"

    async def comments(video_id: str, limit: int, title: str, _: str):
        requested_limits.append(limit)
        return [_comment_item_model(video_id, video_id, title) for _ in range(limit)]

    service.iter_recent_videos = recent_videos  # type: ignore[method-assign]
    service.get_video_comments = comments  # type: ignore[method-assign]
    collected, analyzed_count = await service.collect_channel_comments("UU1", 300, "UC-owner")

    assert len(collected) == 300
    assert analyzed_count == 2
    assert requested_limits == [200, 100]


@pytest.mark.asyncio
async def test_detects_comments_disabled_response() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"error": {"errors": [{"reason": "commentsDisabled"}]}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(YouTubeCommentsUnavailableError):
            await YouTubeService("test-key", client).get_video_comments("video1", 1, "Video", "UC-owner")


@pytest.mark.asyncio
async def test_excludes_comments_written_by_video_owner() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["maxResults"] == "100"
        return httpx.Response(200, json={"items": [_comment_item("owner", "UC-owner"), _comment_item("viewer", "UC-viewer")]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        comments = await YouTubeService("test-key", client).get_video_comments("video1", 1, "Video", "UC-owner")

    assert [comment.id for comment in comments] == ["viewer"]


def _comment_item(comment_id: str, author_channel_id: str = "UC-viewer") -> dict[str, object]:
    return {"snippet": {"topLevelComment": {"id": comment_id, "snippet": {"textDisplay": "A comment", "likeCount": 3, "publishedAt": "2026-01-01T00:00:00Z", "authorChannelId": {"value": author_channel_id}}}}}


def _comment_item_model(comment_id: str, video_id: str, title: str):
    from app.schemas.youtube import Comment
    return Comment(id=comment_id, video_id=video_id, video_title=title, text="A comment", like_count=0, published_at="2026-01-01T00:00:00Z")
