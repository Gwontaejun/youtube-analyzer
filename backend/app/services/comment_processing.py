from collections.abc import Iterable

from app.schemas.youtube import AnalysisComment, Comment


def preprocess_comments(comments: Iterable[Comment]) -> list[Comment]:
    """Remove empty and duplicate comments while normalizing whitespace."""
    processed: list[Comment] = []
    seen_texts: set[str] = set()

    for comment in comments:
        text = " ".join(comment.text.split())
        if not text or text in seen_texts:
            continue
        seen_texts.add(text)
        processed.append(comment.model_copy(update={"text": text}))

    return processed


def create_batches(comments: Iterable[Comment], batch_size: int = 200) -> list[list[AnalysisComment]]:
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")

    batchable_comments = [AnalysisComment(id=comment.id, text=comment.text) for comment in comments]
    return [batchable_comments[index:index + batch_size] for index in range(0, len(batchable_comments), batch_size)]
