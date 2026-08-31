import { AnalysisResponse, VideoTarget } from "../../types/analysis";
import { ChannelDashboard } from "./ChannelDashboard";
import { VideoDashboard } from "./VideoDashboard";

type Props = { result: AnalysisResponse; onReset: () => void; onAnalyzeChannel: (channelId: string) => void };

function isVideoResult(result: AnalysisResponse): result is AnalysisResponse & { targetType: "video"; target: VideoTarget } {
  return result.targetType === "video" && "channelTitle" in result.target;
}

export function Dashboard({ result, onReset, onAnalyzeChannel }: Props) {
  return isVideoResult(result)
    ? <VideoDashboard result={result} onReset={onReset} onAnalyzeChannel={onAnalyzeChannel} />
    : <ChannelDashboard result={result} onReset={onReset} />;
}
