"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dashboard } from "../src/features/analysis/Dashboard";
import { AnalysisResponse } from "../src/types/analysis";

const videoLoading = {
  kicker: "VIDEO COMMENT ANALYSIS",
  messages: ["YouTube 영상을 확인하고 있습니다…", "댓글을 수집하고 있습니다…", "AI가 댓글을 분석하고 있습니다…", "결과를 정리하고 있습니다…"],
  note: "댓글을 수집하고 시청자 반응을 정리하고 있어요.",
};

const channelLoading = {
  kicker: "CHANNEL LOOKUP",
  messages: ["YouTube 채널 정보를 확인하고 있습니다…", "채널 대시보드를 준비하고 있습니다…"],
  note: "채널 메타데이터만 빠르게 확인하고 있어요.",
};

function isChannelUrl(value: string) {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname.split("/").filter(Boolean);
    return (parsed.hostname === "youtube.com" || parsed.hostname === "www.youtube.com")
      && (path[0]?.startsWith("@") || path[0] === "channel");
  } catch {
    return false;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const maxComments = 1000;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingType, setLoadingType] = useState<"video" | "channel">("video");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const loading = loadingType === "channel" ? channelLoading : videoLoading;

  useEffect(() => {
    if (!isSubmitting) { setLoadingStep(0); return; }
    const timer = window.setInterval(() => setLoadingStep((current) => Math.min(current + 1, loading.messages.length - 1)), loadingType === "channel" ? 1600 : 3500);
    return () => window.clearInterval(timer);
  }, [isSubmitting, loading.messages.length, loadingType]);

  async function analyzeUrl(nextUrl: string) {
    setUrl(nextUrl); setResult(null); setMessage(""); setLoadingType(isChannelUrl(nextUrl) ? "channel" : "video"); setIsSubmitting(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: nextUrl, maxComments }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "분석을 요청하지 못했습니다.");
      setResult(payload as AnalysisResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "분석을 요청하지 못했습니다.");
    } finally { setIsSubmitting(false); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeUrl(url);
  }

  if (result) return <Dashboard result={result} onReset={() => setResult(null)} onAnalyzeChannel={(channelId) => analyzeUrl(`https://www.youtube.com/channel/${channelId}`)} />;
  if (isSubmitting) return <main className="loading-page" role="status" aria-live="polite"><div className="loading-state"><p className="loading-kicker">{loading.kicker}</p><span className="loading-orbit" aria-hidden="true" /><p className="loading-message">{loading.messages[loadingStep]}</p><div className="loading-steps" aria-label={`${loadingStep + 1}단계 진행 중`}>{loading.messages.map((_, index) => <span className={index <= loadingStep ? "is-active" : ""} key={index} />)}</div><p className="loading-note">{loading.note}</p></div></main>;

  return <main className="page-shell"><section className="hero" aria-labelledby="page-title"><p className="eyebrow">YOUTUBE CHANNEL ANALYZER</p><h1 id="page-title">YouTube 채널·영상 분석</h1><p className="intro">검색한 채널 또는 영상의 댓글 반응과 콘텐츠 요청을 분석합니다.</p></section>
    <section className="analyzer-card" aria-label="YouTube 채널 분석">
      <form className="search-form" onSubmit={handleSubmit}><label className="sr-only" htmlFor="youtube-url">YouTube 채널 또는 영상 URL</label><input id="youtube-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="YouTube 영상 또는 채널 링크를 붙여넣으세요" required inputMode="url" /><button type="submit">분석하기 <span aria-hidden="true">→</span></button></form>
      {message && <p className="request-message" role="status">{message}</p>}<p className="privacy-note">최근 영상과 최대 1,000개 댓글을 바탕으로 채널을 분석합니다.</p>
    </section>
  </main>;
}
