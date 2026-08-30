export type CategoryKey = "positive" | "question" | "content_request" | "complaint" | "toxic" | "spam" | "other";

export type TopicCount = { topic: string; count: number };
export type CommentExcerpt = { id: string; text: string };
export type ContentIdea = { title: string; reason: string; sourceTopics: string[]; evidenceComments: CommentExcerpt[] };

type BaseTarget = { id: string; title: string; thumbnail: string | null };
export type VideoTarget = BaseTarget & { channelId: string; channelTitle: string; publishedAt: string };
export type ChannelTarget = BaseTarget & { uploadsPlaylistId: string };

export type AnalysisResponse = {
  targetType: "video" | "channel";
  target: VideoTarget | ChannelTarget;
  totalComments: number;
  categories: Record<CategoryKey, number>;
  topRequests: TopicCount[];
  topComplaints: TopicCount[];
  summary: string;
  contentIdeas: ContentIdea[];
  analyzedVideoCount: number | null;
};
