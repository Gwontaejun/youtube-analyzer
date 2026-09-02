import Image from "next/image";

import {
  AnalysisResponse,
  ChannelTarget,
  VideoTarget,
} from "../../../types/analysis";

type Props = {
  result: AnalysisResponse;
  onReset: () => void;
  onAnalyzeChannel?: (channelId: string) => void;
};

function isVideoTarget(
  target: AnalysisResponse["target"],
): target is VideoTarget {
  return "channelTitle" in target;
}
function isChannelTarget(
  target: AnalysisResponse["target"],
): target is ChannelTarget {
  return "subscriberCount" in target;
}
function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function SubscribersIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="7" r="3.5" />
      <path d="M17 9.5a3 3 0 0 1 0 5.8M18.5 20v-1.2a3.8 3.8 0 0 0-2.5-3.6" />
    </svg>
  );
}
function ViewsIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}
function VideosIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3V9Z" />
    </svg>
  );
}

export function TargetHeader({ result, onReset, onAnalyzeChannel }: Props) {
  const target = result.target;
  if (result.targetType === "channel" && isChannelTarget(target)) {
    return (
      <header className="result-header">
        <div className="result-header-actions">
          <button className="text-button" type="button" onClick={onReset}>
            ← 새 분석
          </button>
        </div>
        <section className="channel-hero">
          <div className="channel-hero-profile">
            {target.thumbnail ? (
              <Image
                src={target.thumbnail}
                alt={`${target.title} 채널 이미지`}
                width={112}
                height={112}
                className="channel-hero-avatar"
              />
            ) : (
              <div className="channel-hero-placeholder">▶</div>
            )}
            <div className="channel-hero-copy">
              <p className="eyebrow">CHANNEL SNAPSHOT</p>
              <h1>{target.title}</h1>
              <p>채널 정보와 최근 콘텐츠를 한눈에 확인하세요.</p>
            </div>
            <a
              className="channel-external-link"
              href={`https://www.youtube.com/channel/${encodeURIComponent(target.id)}`}
              target="_blank"
              rel="noreferrer"
            >
              YouTube 채널 보기 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="channel-hero-metrics">
            <div className="channel-hero-metric metric-subscribers">
              <span className="metric-icon" aria-hidden="true">
                <SubscribersIcon />
              </span>
              <div>
                <small>구독자</small>
                <strong>
                  {target.hiddenSubscriberCount
                    ? "비공개"
                    : formatCount(target.subscriberCount)}
                </strong>
              </div>
            </div>
            <div className="channel-hero-metric metric-views">
              <span className="metric-icon" aria-hidden="true">
                <ViewsIcon />
              </span>
              <div>
                <small>누적 조회수</small>
                <strong>{formatCount(target.viewCount)}</strong>
              </div>
            </div>
            <div className="channel-hero-metric metric-videos">
              <span className="metric-icon" aria-hidden="true">
                <VideosIcon />
              </span>
              <div>
                <small>영상 갯수</small>
                <strong>{formatCount(target.videoCount)}</strong>
              </div>
            </div>
          </div>
        </section>
      </header>
    );
  }
  if (!isVideoTarget(target)) return null;
  return (
    <header className="result-header">
      <div className="result-header-actions">
        <button className="text-button" type="button" onClick={onReset}>
          ← 새 분석
        </button>
        {onAnalyzeChannel && (
          <button
            className="channel-analysis-link"
            type="button"
            onClick={() => onAnalyzeChannel(target.channelId)}
          >
            이 채널 분석 <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
      <div className="target-card">
        {target.thumbnail ? (
          <Image
            src={target.thumbnail}
            alt={`${target.title} 썸네일`}
            width={150}
            height={84}
            className="target-thumbnail"
          />
        ) : (
          <div className="target-placeholder">▶</div>
        )}
        <div className="target-copy">
          <p className="eyebrow">VIDEO ANALYSIS</p>
          <h1>{target.title}</h1>
          <div className="video-meta-row">
            <span className="target-channel">{target.channelTitle}</span>
            <span className="video-like-count">
              👍 좋아요 <strong>{formatCount(target.likeCount)}</strong>
            </span>
            <a
              className="video-link"
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(target.id)}`}
              target="_blank"
              rel="noreferrer"
            >
              영상 보기 <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="comment-total">
          <strong>{formatCount(result.totalComments)}</strong>
          <span>분석 댓글</span>
        </div>
      </div>
    </header>
  );
}
