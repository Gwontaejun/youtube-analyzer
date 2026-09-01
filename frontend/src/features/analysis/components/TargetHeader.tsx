import Image from "next/image";

import { AnalysisResponse, ChannelTarget, VideoTarget } from "../../../types/analysis";

type Props = { result: AnalysisResponse; onReset: () => void; onAnalyzeChannel?: (channelId: string) => void };

function isVideoTarget(target: AnalysisResponse["target"]): target is VideoTarget {
  return "channelTitle" in target;
}

function isChannelTarget(target: AnalysisResponse["target"]): target is ChannelTarget {
  return "subscriberCount" in target;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function TargetHeader({ result, onReset, onAnalyzeChannel }: Props) {
  const isVideo = result.targetType === "video";
  const target = result.target;

  return <header className="result-header">
    <div className="result-header-actions"><button className="text-button" type="button" onClick={onReset}>← 새 분석</button>{isVideo && isVideoTarget(target) && onAnalyzeChannel && <button className="channel-analysis-link" type="button" onClick={() => onAnalyzeChannel(target.channelId)}>이 채널 분석 <span aria-hidden="true">→</span></button>}</div>
    <div className="target-card">
      {target.thumbnail ? <Image src={target.thumbnail} alt={`${target.title} 썸네일`} width={150} height={84} className="target-thumbnail" /> : <div className="target-placeholder">▶</div>}
      <div className="target-copy"><p className="eyebrow">{isVideo ? "VIDEO ANALYSIS" : "CHANNEL ANALYSIS"}</p><h1>{target.title}</h1>{isVideo && isVideoTarget(target) ? <div className="video-meta-row"><span className="target-channel">{target.channelTitle}</span><span className="video-like-count">👍 좋아요 <strong>{formatCount(target.likeCount)}</strong></span><a className="video-link" href={`https://www.youtube.com/watch?v=${encodeURIComponent(target.id)}`} target="_blank" rel="noreferrer">영상 보기 <span aria-hidden="true">↗</span></a></div> : <p>공개 채널 정보와 최근 콘텐츠 성과</p>}</div>
      <div className="comment-total"><strong>{!isVideo && isChannelTarget(target) && target.hiddenSubscriberCount ? "비공개" : formatCount(!isVideo && isChannelTarget(target) ? target.subscriberCount : result.totalComments)}</strong><span>{isVideo ? "분석 댓글" : "구독자"}</span></div>
    </div>
  </header>;
}
