import pytest

from app.schemas.youtube import Comment
from app.services.comment_processing import create_batches, preprocess_comments


def test_preprocess_removes_empty_and_duplicate_comments() -> None:
    comments = [_comment("first", "  Great\n video!  "), _comment("second", "Great video!"), _comment("third", " \t "), _comment("fourth", "Keep it up")]

    processed = preprocess_comments(comments)

    assert [(comment.id, comment.text) for comment in processed] == [("first", "Great video!"), ("fourth", "Keep it up")]


def test_create_batches_keeps_only_gemini_input_fields() -> None:
    batches = create_batches([_comment(str(index), f"comment {index}") for index in range(5)], batch_size=2)

    assert [[item.model_dump() for item in batch] for batch in batches] == [
        [{"id": "0", "text": "comment 0"}, {"id": "1", "text": "comment 1"}],
        [{"id": "2", "text": "comment 2"}, {"id": "3", "text": "comment 3"}],
        [{"id": "4", "text": "comment 4"}],
    ]


def test_create_batches_rejects_invalid_batch_size() -> None:
    with pytest.raises(ValueError, match="at least 1"):
        create_batches([_comment("1", "text")], batch_size=0)


def _comment(comment_id: str, text: str) -> Comment:
    return Comment(id=comment_id, video_id="video1", video_title="Video", text=text, like_count=0, published_at="2026-01-01T00:00:00Z")
