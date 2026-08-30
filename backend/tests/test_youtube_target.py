import pytest

from app.schemas.youtube import TargetType
from app.services.youtube_target import InvalidYouTubeUrl, detect_youtube_target


@pytest.mark.parametrize(("url", "target_type", "identifier", "value"), [
    ("https://youtube.com/watch?v=abc123&t=20", TargetType.VIDEO, "video_id", "abc123"),
    ("https://www.youtube.com/watch?v=abc123", TargetType.VIDEO, "video_id", "abc123"),
    ("https://youtu.be/abc123?feature=share", TargetType.VIDEO, "video_id", "abc123"),
    ("https://youtube.com/shorts/abc123", TargetType.VIDEO, "video_id", "abc123"),
    ("https://youtube.com/@example", TargetType.CHANNEL, "handle", "@example"),
    ("https://www.youtube.com/channel/UC123", TargetType.CHANNEL, "channel_id", "UC123"),
])
def test_detect_supported_targets(url: str, target_type: TargetType, identifier: str, value: str) -> None:
    target = detect_youtube_target(url)
    assert target.target_type is target_type
    assert getattr(target, identifier) == value


@pytest.mark.parametrize("url", ["https://example.com/video", "https://youtube.com/watch", "https://youtube.com/results?search_query=x", "not-a-url"])
def test_rejects_unsupported_urls(url: str) -> None:
    with pytest.raises(InvalidYouTubeUrl):
        detect_youtube_target(url)
