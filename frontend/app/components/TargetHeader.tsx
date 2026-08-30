import { AnalysisResponse, VideoTarget } from "../types";

type Props = { result: AnalysisResponse; onReset: () => void };

function isVideoTarget(target: AnalysisResponse["target"]): target is VideoTarget {
  return "channelTitle" in target;
}

export function TargetHeader({ result, onReset }: Props) {
  const isVideo = result.targetType === "video";
  const target = result.target;

  return <header className="result-header">
    <button className="text-button" type="button" onClick={onReset}>← 새 분석</button>
    <div className="target-card">
      {target.thumbnail ? <img src={target.thumbnail} alt="" className="target-thumbnail" /> : <div className="target-placeholder">▶</div>}
      <div className="target-copy">
        <p className="eyebrow">{isVideo ? "VIDEO ANALYSIS" : "CHANNEL ANALYSIS"}</p>
        <h1>{target.title}</h1>
        <p>{isVideo && isVideoTarget(target) ? target.channelTitle : "최근 채널 전반의 시청자 반응"}</p>
      </div>
      <div className="comment-total">
        <strong>{result.totalComments.toLocaleString()}</strong>
        <span>분석 댓글</span>
        {!isVideo && result.analyzedVideoCount !== null && <small>최근 영상 {result.analyzedVideoCount}개</small>}
      </div>
    </div>
  </header>;
}
