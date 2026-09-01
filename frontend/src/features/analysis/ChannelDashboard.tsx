"use client";

import Image from "next/image";
import { useState } from "react";

import { SectionHeading } from "../../components/SectionHeading";
import { AnalysisResponse, ChannelTarget, ChannelVideo } from "../../types/analysis";
import { formatDuration } from "./channel-metrics";
import { TargetHeader } from "./components/TargetHeader";

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string) {
  if (!value) return "정보 없음";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function VideoCards({ videos, emptyCopy }: { videos: ChannelVideo[]; emptyCopy: string }) {
  if (!videos.length) return <p className="empty-copy">{emptyCopy}</p>;
  return <div className="channel-video-cards">{videos.map((video) => <a className="channel-video-card" href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`} target="_blank" rel="noreferrer" key={video.id}>
    {video.thumbnail ? <Image src={video.thumbnail} alt="" width={320} height={180} className="channel-video-thumbnail" /> : <div className="channel-video-placeholder">▶</div>}
    <div className="channel-video-card-copy"><span>{formatDate(video.publishedAt)} · {formatDuration(video.durationSeconds)}</span><h3>{video.title}</h3></div>
    <div className="channel-video-card-metrics"><span>조회 <strong>{formatCount(video.viewCount)}</strong></span><span>좋아요 <strong>{formatCount(video.likeCount)}</strong></span><span>댓글 <strong>{formatCount(video.commentCount)}</strong></span></div>
  </a>)}</div>;
}

export function ChannelDashboard({ result, onReset }: { result: AnalysisResponse; onReset: () => void }) {
  const channel = result.target as ChannelTarget;
  const longFormVideos = result.recentVideos.filter((video) => video.durationSeconds > 180);
  const shortVideos = result.recentVideos.filter((video) => video.durationSeconds > 0 && video.durationSeconds <= 180);
  const [contentType, setContentType] = useState<"long-form" | "shorts">("long-form");
  const selectedVideos = contentType === "long-form" ? longFormVideos : shortVideos;
  const stats = [
    ["구독자", channel.hiddenSubscriberCount ? "비공개" : formatCount(channel.subscriberCount)],
    ["누적 조회수", formatCount(channel.viewCount)],
    ["공개 영상", formatCount(channel.videoCount)],
    ["개설일", formatDate(channel.publishedAt)],
  ];

  return <main className="dashboard-shell channel-dashboard">
    <TargetHeader result={result} onReset={onReset} />
    <section className="channel-stats-section"><SectionHeading eyebrow="CHANNEL OVERVIEW" title="채널 한눈에 보기" />
      <div className="channel-stat-grid">{stats.map(([label, value]) => <div className="channel-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    </section>
    <section className="channel-video-group"><div className="channel-video-group-heading"><SectionHeading eyebrow="RECENT CONTENT" title="최근 공개 영상" /><div className="content-type-tabs" role="tablist" aria-label="영상 형식"><button className={contentType === "long-form" ? "is-active" : ""} type="button" role="tab" aria-selected={contentType === "long-form"} onClick={() => setContentType("long-form")}>롱폼 <span>{longFormVideos.length}</span></button><button className={contentType === "shorts" ? "is-active" : ""} type="button" role="tab" aria-selected={contentType === "shorts"} onClick={() => setContentType("shorts")}>숏츠 <span>{shortVideos.length}</span></button></div></div>
      <VideoCards videos={selectedVideos} emptyCopy={contentType === "long-form" ? "최근 롱폼 영상을 찾지 못했습니다." : "최근 숏츠를 찾지 못했습니다."} />
    </section>
    <p className="channel-data-note">공개 영상의 길이를 기준으로 3분 이하 영상을 숏츠로 분류했습니다.</p>
  </main>;
}
