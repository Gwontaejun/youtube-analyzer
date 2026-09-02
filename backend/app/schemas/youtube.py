from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class TargetType(str, Enum):
    CHANNEL = "channel"
    VIDEO = "video"


class YouTubeTarget(BaseModel):
    target_type: TargetType
    video_id: str | None = None
    channel_id: str | None = None
    handle: str | None = None

    @model_validator(mode="after")
    def validate_identifier(self) -> "YouTubeTarget":
        identifiers = (self.video_id, self.channel_id, self.handle)
        if sum(value is not None for value in identifiers) != 1:
            raise ValueError("Target must contain exactly one identifier")
        return self


class ResolveRequest(BaseModel):
    url: HttpUrl


class CollectCommentsRequest(ResolveRequest):
    max_comments: int = Field(default=100, ge=1, le=1000, alias="maxComments")

    model_config = ConfigDict(populate_by_name=True)


class ChannelInfo(BaseModel):
    id: str
    title: str
    thumbnail: str | None = None
    description: str = ""
    country: str | None = None
    published_at: str = Field(default="", serialization_alias="publishedAt")
    subscriber_count: int = Field(default=0, serialization_alias="subscriberCount")
    view_count: int = Field(default=0, serialization_alias="viewCount")
    video_count: int = Field(default=0, serialization_alias="videoCount")
    hidden_subscriber_count: bool = Field(default=False, serialization_alias="hiddenSubscriberCount")
    uploads_playlist_id: str = Field(serialization_alias="uploadsPlaylistId")

    model_config = ConfigDict(populate_by_name=True)


class VideoInfo(BaseModel):
    id: str
    title: str
    thumbnail: str | None = None
    channel_id: str = Field(serialization_alias="channelId")
    channel_title: str = Field(serialization_alias="channelTitle")
    published_at: str = Field(serialization_alias="publishedAt")
    like_count: int = Field(default=0, serialization_alias="likeCount")

    model_config = ConfigDict(populate_by_name=True)


class ChannelVideo(BaseModel):
    id: str
    title: str
    thumbnail: str | None = None
    published_at: str = Field(serialization_alias="publishedAt")
    view_count: int = Field(default=0, serialization_alias="viewCount")
    like_count: int = Field(default=0, serialization_alias="likeCount")
    comment_count: int = Field(default=0, serialization_alias="commentCount")
    duration_seconds: int = Field(default=0, serialization_alias="durationSeconds")

    model_config = ConfigDict(populate_by_name=True)


class ChannelInsightInput(BaseModel):
    channel: ChannelInfo
    recent_videos: list[ChannelVideo]


class ChannelInsight(BaseModel):
    summary: str
    strengths: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)


class Comment(BaseModel):
    id: str
    video_id: str = Field(serialization_alias="videoId")
    video_title: str = Field(serialization_alias="videoTitle")
    text: str
    like_count: int = Field(serialization_alias="likeCount")
    published_at: str = Field(serialization_alias="publishedAt")

    model_config = ConfigDict(populate_by_name=True)


class AnalysisComment(BaseModel):
    id: str
    text: str


class CommentCategory(str, Enum):
    POSITIVE = "positive"
    QUESTION = "question"
    CONTENT_REQUEST = "content_request"
    COMPLAINT = "complaint"
    TOXIC = "toxic"
    SPAM = "spam"
    OTHER = "other"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class CommentAnalysis(BaseModel):
    id: str
    category: CommentCategory
    topic: str | None = None
    sentiment: Sentiment


class TopicCount(BaseModel):
    topic: str
    count: int


class CommentExcerpt(BaseModel):
    id: str
    text: str


class TopicEvidence(TopicCount):
    evidence_comments: list[CommentExcerpt] = Field(
        default_factory=list, serialization_alias="evidenceComments"
    )

    model_config = ConfigDict(populate_by_name=True)


class ContentIdea(BaseModel):
    title: str
    reason: str
    source_topics: list[str] = Field(default_factory=list, alias="sourceTopics")
    evidence_comments: list[CommentExcerpt] = Field(
        default_factory=list, serialization_alias="evidenceComments"
    )

    model_config = ConfigDict(populate_by_name=True)


class FinalInsight(BaseModel):
    summary: str
    top_requests: list[TopicCount] = Field(alias="topRequests")
    top_complaints: list[TopicCount] = Field(alias="topComplaints")
    content_ideas: list[ContentIdea] = Field(alias="contentIdeas")

    model_config = ConfigDict(populate_by_name=True)


class InsightInput(BaseModel):
    target_type: TargetType
    target_title: str
    total_comments: int
    categories: dict[str, int]
    topics: list[TopicCount]
    request_topics: list[TopicCount]
    complaint_topics: list[TopicCount]


class ResolveResponse(BaseModel):
    target_type: TargetType = Field(serialization_alias="targetType")
    target: ChannelInfo | VideoInfo

    model_config = ConfigDict(populate_by_name=True)


class CollectCommentsResponse(BaseModel):
    target_type: TargetType = Field(serialization_alias="targetType")
    target: ChannelInfo | VideoInfo
    comments: list[Comment]
    analyzed_video_count: int | None = Field(default=None, serialization_alias="analyzedVideoCount")

    model_config = ConfigDict(populate_by_name=True)


class PrepareCommentsResponse(BaseModel):
    target_type: TargetType = Field(serialization_alias="targetType")
    target: ChannelInfo | VideoInfo
    collected_comment_count: int = Field(serialization_alias="collectedCommentCount")
    processed_comment_count: int = Field(serialization_alias="processedCommentCount")
    batches: list[list[AnalysisComment]]
    analyzed_video_count: int | None = Field(default=None, serialization_alias="analyzedVideoCount")

    model_config = ConfigDict(populate_by_name=True)


class AnalyzeCommentsResponse(BaseModel):
    target_type: TargetType = Field(serialization_alias="targetType")
    target: ChannelInfo | VideoInfo
    collected_comment_count: int = Field(serialization_alias="collectedCommentCount")
    processed_comment_count: int = Field(serialization_alias="processedCommentCount")
    analysis_results: list[CommentAnalysis] = Field(serialization_alias="analysisResults")
    categories: dict[str, int]
    topics: list[TopicEvidence]
    insight: FinalInsight
    analyzed_video_count: int | None = Field(default=None, serialization_alias="analyzedVideoCount")

    model_config = ConfigDict(populate_by_name=True)


class AnalyzeResponse(BaseModel):
    target_type: TargetType = Field(serialization_alias="targetType")
    target: ChannelInfo | VideoInfo
    total_comments: int = Field(serialization_alias="totalComments")
    categories: dict[str, int]
    top_requests: list[TopicCount] = Field(serialization_alias="topRequests")
    top_complaints: list[TopicCount] = Field(serialization_alias="topComplaints")
    summary: str
    content_ideas: list[ContentIdea] = Field(serialization_alias="contentIdeas")
    analyzed_video_count: int | None = Field(default=None, serialization_alias="analyzedVideoCount")
    recent_videos: list[ChannelVideo] = Field(default_factory=list, serialization_alias="recentVideos")
    channel_insight: ChannelInsight | None = Field(default=None, serialization_alias="channelInsight")

    model_config = ConfigDict(populate_by_name=True)
