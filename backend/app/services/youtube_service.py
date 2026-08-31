from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.config import get_settings
from app.schemas.youtube import ChannelInfo, Comment, VideoInfo


class YouTubeServiceError(RuntimeError):
    pass


class YouTubeNotFoundError(YouTubeServiceError):
    pass


class YouTubeCommentsUnavailableError(YouTubeServiceError):
    pass


class YouTubeService:
    base_url = "https://www.googleapis.com/youtube/v3"
    max_channel_comments_per_video = 200

    def __init__(self, api_key: str, client: httpx.AsyncClient | None = None) -> None:
        self.api_key = api_key
        self.client = client

    async def _request(self, resource: str, params: dict[str, str]) -> dict[str, Any]:
        request_params = {**params, "key": self.api_key}
        if self.client:
            response = await self.client.get(f"{self.base_url}/{resource}", params=request_params)
        else:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.base_url}/{resource}", params=request_params)
        if response.status_code >= 400:
            if resource == "commentThreads" and _is_comments_unavailable(response):
                raise YouTubeCommentsUnavailableError("Comments are unavailable for this video")
            raise YouTubeServiceError("YouTube metadata lookup failed")
        return response.json()

    async def get_channel_info(self, *, channel_id: str | None = None, handle: str | None = None) -> ChannelInfo:
        if bool(channel_id) == bool(handle):
            raise ValueError("Provide either channel_id or handle")
        params = {"part": "snippet,contentDetails", **({"id": channel_id} if channel_id else {"forHandle": handle or ""})}
        payload = await self._request("channels", params)
        items = payload.get("items", [])
        if not items:
            raise YouTubeNotFoundError("Channel not found")
        item = items[0]
        snippet, details = item["snippet"], item["contentDetails"]
        return ChannelInfo(id=item["id"], title=snippet["title"], thumbnail=_thumbnail(snippet), uploads_playlist_id=details["relatedPlaylists"]["uploads"])

    async def get_video_info(self, video_id: str) -> VideoInfo:
        payload = await self._request("videos", {"part": "snippet,statistics", "id": video_id})
        items = payload.get("items", [])
        if not items:
            raise YouTubeNotFoundError("Video not found or unavailable")
        item = items[0]
        snippet, statistics = item["snippet"], item.get("statistics", {})
        return VideoInfo(
            id=item["id"], title=snippet["title"], thumbnail=_thumbnail(snippet),
            channel_id=snippet["channelId"], channel_title=snippet["channelTitle"],
            published_at=snippet["publishedAt"], like_count=int(statistics.get("likeCount", 0)),
        )

    async def get_video_comments(
        self, video_id: str, max_comments: int, video_title: str, owner_channel_id: str
    ) -> list[Comment]:
        comments: list[Comment] = []
        page_token: str | None = None
        while len(comments) < max_comments:
            params = {
                "part": "snippet",
                "videoId": video_id,
                # Fetch a full API page, then apply our own filtering. Otherwise a
                # requested limit of 1 can be consumed by the channel owner's comment.
                "maxResults": "100",
                "textFormat": "plainText",
            }
            if page_token:
                params["pageToken"] = page_token
            payload = await self._request("commentThreads", params)
            for item in payload.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]
                author_channel_id = snippet.get("authorChannelId", {}).get("value")
                if author_channel_id == owner_channel_id:
                    continue
                comments.append(Comment(
                    id=item["snippet"]["topLevelComment"]["id"], video_id=video_id,
                    video_title=video_title, text=snippet["textDisplay"],
                    like_count=snippet["likeCount"], published_at=snippet["publishedAt"],
                ))
                if len(comments) == max_comments:
                    break
            page_token = payload.get("nextPageToken")
            if not page_token:
                break
        return comments

    async def iter_recent_videos(self, uploads_playlist_id: str) -> AsyncIterator[tuple[str, str]]:
        page_token: str | None = None
        while True:
            params = {"part": "snippet", "playlistId": uploads_playlist_id, "maxResults": "50"}
            if page_token:
                params["pageToken"] = page_token
            payload = await self._request("playlistItems", params)
            for item in payload.get("items", []):
                resource_id = item.get("snippet", {}).get("resourceId", {})
                video_id = resource_id.get("videoId")
                if video_id:
                    yield video_id, item["snippet"].get("title", "Untitled video")
            page_token = payload.get("nextPageToken")
            if not page_token:
                break

    async def collect_channel_comments(
        self, uploads_playlist_id: str, max_comments: int, owner_channel_id: str
    ) -> tuple[list[Comment], int]:
        comments: list[Comment] = []
        analyzed_video_count = 0
        async for video_id, video_title in self.iter_recent_videos(uploads_playlist_id):
            try:
                video_comments = await self.get_video_comments(
                    video_id,
                    min(self.max_channel_comments_per_video, max_comments - len(comments)),
                    video_title,
                    owner_channel_id,
                )
            except YouTubeCommentsUnavailableError:
                continue
            analyzed_video_count += 1
            comments.extend(video_comments)
            if len(comments) >= max_comments:
                break
        return comments, analyzed_video_count


def _thumbnail(snippet: dict[str, Any]) -> str | None:
    thumbnails = snippet.get("thumbnails", {})
    for size in ("high", "medium", "default"):
        if url := thumbnails.get(size, {}).get("url"):
            return url
    return None


def _is_comments_unavailable(response: httpx.Response) -> bool:
    try:
        reasons = {error.get("reason") for error in response.json().get("error", {}).get("errors", [])}
    except (ValueError, AttributeError):
        return False
    return bool(reasons & {"commentsDisabled", "videoNotFound"})


def get_youtube_service() -> YouTubeService:
    api_key = get_settings().youtube_api_key
    if not api_key:
        raise YouTubeServiceError("YouTube API key is not configured")
    return YouTubeService(api_key)
