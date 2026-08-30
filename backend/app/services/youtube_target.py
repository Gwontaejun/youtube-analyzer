from urllib.parse import parse_qs, urlparse

from app.schemas.youtube import TargetType, YouTubeTarget


class InvalidYouTubeUrl(ValueError):
    """Raised when a URL is not a supported public YouTube target."""


def detect_youtube_target(url: str) -> YouTubeTarget:
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    path_parts = [part for part in parsed.path.split("/") if part]

    if parsed.scheme not in {"http", "https"} or host not in {"youtube.com", "youtu.be"}:
        raise InvalidYouTubeUrl("A supported YouTube URL is required")

    if host == "youtu.be" and path_parts:
        return YouTubeTarget(target_type=TargetType.VIDEO, video_id=path_parts[0])

    if not path_parts:
        raise InvalidYouTubeUrl("The YouTube URL does not identify a channel or video")

    if path_parts[0] == "watch":
        video_id = parse_qs(parsed.query).get("v", [None])[0]
        if video_id:
            return YouTubeTarget(target_type=TargetType.VIDEO, video_id=video_id)
    elif path_parts[0] == "shorts" and len(path_parts) >= 2:
        return YouTubeTarget(target_type=TargetType.VIDEO, video_id=path_parts[1])
    elif path_parts[0].startswith("@"):
        return YouTubeTarget(target_type=TargetType.CHANNEL, handle=path_parts[0])
    elif path_parts[0] == "channel" and len(path_parts) >= 2:
        return YouTubeTarget(target_type=TargetType.CHANNEL, channel_id=path_parts[1])

    raise InvalidYouTubeUrl("The YouTube URL format is not supported")
