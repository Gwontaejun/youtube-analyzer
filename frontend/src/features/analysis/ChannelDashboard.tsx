"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";

import { SectionHeading } from "../../components/SectionHeading";
import { AnalysisResponse, ChannelVideo } from "../../types/analysis";
import { formatDuration } from "./channel-metrics";
import { TargetHeader } from "./components/TargetHeader";

const ChannelPerformanceChart = dynamic(
  () =>
    import("./components/ChannelPerformanceChart").then(
      (module) => module.ChannelPerformanceChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="channel-performance-loading" aria-hidden="true" />
    ),
  },
);

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
function formatDate(value: string) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value))
    : "정보 없음";
}

function VideoCards({
  videos,
  emptyCopy,
}: {
  videos: ChannelVideo[];
  emptyCopy: string;
}) {
  if (!videos.length) return <p className="empty-copy">{emptyCopy}</p>;
  return (
    <div className="channel-video-cards">
      {videos.map((video) => (
        <a
          className="channel-video-card"
          href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`}
          target="_blank"
          rel="noreferrer"
          key={video.id}
        >
          <div className="channel-video-thumbnail-wrap">
            {video.thumbnail ? (
              <Image
                src={video.thumbnail}
                alt=""
                width={320}
                height={180}
                className="channel-video-thumbnail"
              />
            ) : (
              <div className="channel-video-placeholder">▶</div>
            )}
            <span className="channel-video-duration">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>
          <div className="channel-video-card-copy">
            <span>{formatDate(video.publishedAt)}</span>
            <h3>{video.title}</h3>
          </div>
          <div className="channel-video-card-metrics">
            <span>
              조회 <strong>{formatCount(video.viewCount)}</strong>
            </span>
            <span>
              좋아요 <strong>{formatCount(video.likeCount)}</strong>
            </span>
            <span>
              댓글 <strong>{formatCount(video.commentCount)}</strong>
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function ChannelDashboard({
  result,
  onReset,
}: {
  result: AnalysisResponse;
  onReset: () => void;
}) {
  const longFormVideos = result.recentVideos.filter(
    (video) => video.durationSeconds > 180,
  );
  const shortVideos = result.recentVideos.filter(
    (video) => video.durationSeconds > 0 && video.durationSeconds <= 180,
  );
  const [contentType, setContentType] = useState<"long-form" | "shorts">(
    "long-form",
  );
  const selectedVideos =
    contentType === "long-form" ? longFormVideos : shortVideos;

  return (
    <main className="dashboard-shell channel-dashboard">
      <TargetHeader result={result} onReset={onReset} />
      {result.channelInsight ? (
        <section
          className="channel-ai-insight"
          aria-labelledby="channel-insight-title"
        >
          <div className="channel-ai-insight-heading">
            <div>
              <p className="eyebrow">AI INSIGHT</p>
              <h2 id="channel-insight-title">최근 콘텐츠 흐름</h2>
            </div>
            <span className="channel-ai-label">AI 분석</span>
          </div>
          <p className="channel-ai-summary">{result.channelInsight.summary}</p>
          <div className="channel-ai-points">
            <div>
              <h3>반응이 확인된 흐름</h3>
              <ul>
                {result.channelInsight.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>다음 콘텐츠 실험</h3>
              <ul>
                {result.channelInsight.opportunities.map((opportunity) => (
                  <li key={opportunity}>{opportunity}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="channel-ai-note">
            채널 정보와 최근 영상 데이터만 사용한 현재 시점의 분석입니다.
          </p>
        </section>
      ) : null}
      <ChannelPerformanceChart videos={result.recentVideos} />
      <section className="channel-video-group">
        <div className="channel-video-group-heading">
          <SectionHeading eyebrow="RECENT CONTENT" title="최근 영상" />
        </div>
        <div
          className="content-type-tabs"
          role="tablist"
          aria-label="영상 형식"
        >
          <button
            className={contentType === "long-form" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={contentType === "long-form"}
            onClick={() => setContentType("long-form")}
          >
            <span>롱폼 영상</span>
            <b>{longFormVideos.length}</b>
          </button>
          <button
            className={contentType === "shorts" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={contentType === "shorts"}
            onClick={() => setContentType("shorts")}
          >
            <span>Shorts</span>
            <b>{shortVideos.length}</b>
          </button>
        </div>
        <VideoCards
          videos={selectedVideos}
          emptyCopy={
            contentType === "long-form"
              ? "최근 롱폼 영상을 찾지 못했습니다."
              : "최근 숏츠를 찾지 못했습니다."
          }
        />
      </section>
    </main>
  );
}
