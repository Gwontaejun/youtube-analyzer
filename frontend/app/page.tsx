"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { AnalysisResponse } from "./types";

const commentOptions = [100, 300, 500, 1000];
const loadingMessages = ["YouTube 데이터를 확인하고 있습니다…", "댓글을 수집하고 있습니다…", "AI가 댓글을 분석하고 있습니다…", "결과를 정리하고 있습니다…"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [maxComments, setMaxComments] = useState(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    if (!isSubmitting) { setLoadingStep(0); return; }
    const timer = window.setInterval(() => setLoadingStep((current) => Math.min(current + 1, loadingMessages.length - 1)), 3500);
    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setIsSubmitting(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, maxComments }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "분석을 요청하지 못했습니다.");
      setResult(payload as AnalysisResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "분석을 요청하지 못했습니다.");
    } finally { setIsSubmitting(false); }
  }

  if (result) return <Dashboard result={result} onReset={() => setResult(null)} />;

  return <main className="page-shell"><section className="hero" aria-labelledby="page-title"><p className="eyebrow">YOUTUBE COMMENT INSIGHT</p><h1 id="page-title">댓글 속 시청자 반응을<br />한눈에 분석하세요.</h1><p className="intro">채널 또는 영상 링크 하나로 시청자 반응, 콘텐츠 요청, 주요 불만을 찾아드립니다.</p></section>
    <section className="analyzer-card" aria-labelledby="analyzer-title"><div className="card-heading"><span className="step">01</span><div><h2 id="analyzer-title">YouTube 링크 입력</h2><p>채널과 영상 URL을 자동으로 구분합니다.</p></div></div>
      {isSubmitting ? <div className="loading-state" role="status" aria-live="polite"><span className="loading-orbit" aria-hidden="true" /><p className="loading-label">분석을 진행하고 있습니다</p><p className="loading-message">{loadingMessages[loadingStep]}</p><p className="loading-note">분석이 끝나면 결과를 자동으로 불러옵니다.</p></div> : <form onSubmit={handleSubmit}><label htmlFor="youtube-url">채널 또는 영상 URL</label><input id="youtube-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/..." required inputMode="url" /><fieldset><legend>분석할 댓글 수</legend><div className="comment-options">{commentOptions.map((count) => <label className="option" key={count}><input type="radio" name="max-comments" value={count} checked={maxComments === count} onChange={() => setMaxComments(count)} /><span>{count.toLocaleString()}개</span></label>)}</div></fieldset><button type="submit">댓글 분석하기 <span aria-hidden="true">→</span></button></form>}
      {message && <p className="request-message" role="status">{message}</p>}<p className="privacy-note">API 키는 안전하게 서버에서만 사용됩니다.</p>
    </section>
    <section className="features" aria-label="분석 범위"><article><span>01</span><h2>시청자 반응</h2><p>긍정, 질문, 불만 등 댓글의 흐름을 파악합니다.</p></article><article><span>02</span><h2>콘텐츠 요청</h2><p>시청자가 다음으로 보고 싶어 하는 주제를 찾습니다.</p></article><article><span>03</span><h2>근거 확인</h2><p>토픽과 아이디어의 근거가 된 댓글을 함께 확인합니다.</p></article></section>
  </main>;
}
