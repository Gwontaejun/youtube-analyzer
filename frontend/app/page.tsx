"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dashboard } from "../src/features/analysis/Dashboard";
import { AdSupportedLayout } from "../src/shared/AdSupportedLayout";
import { AnalysisResponse } from "../src/types/analysis";

const videoLoading = {
  kicker: "VIDEO COMMENT ANALYSIS",
  messages: [
    "YouTube 영상을 확인하고 있습니다…",
    "댓글을 수집하고 있습니다…",
    "AI가 댓글을 분석하고 있습니다…",
    "결과를 정리하고 있습니다…",
  ],
  note: "댓글을 수집하고 시청자 반응을 정리하고 있어요.",
};

const channelLoading = {
  kicker: "CHANNEL ANALYSIS",
  messages: [
    "YouTube 채널 정보를 확인하고 있습니다…",
    "최근 영상 데이터를 정리하고 있습니다…",
    "AI가 채널 인사이트를 만들고 있습니다…",
  ],
  note: "공개 채널 데이터로 현재 시점의 인사이트를 만들고 있어요.",
};

function isChannelUrl(value: string) {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname.split("/").filter(Boolean);
    return (
      (parsed.hostname === "youtube.com" ||
        parsed.hostname === "www.youtube.com") &&
      (path[0]?.startsWith("@") || path[0] === "channel")
    );
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
    if (!isSubmitting) {
      setLoadingStep(0);
      return;
    }
    const timer = window.setInterval(
      () =>
        setLoadingStep((current) =>
          Math.min(current + 1, loading.messages.length - 1),
        ),
      loadingType === "channel" ? 2500 : 3500,
    );
    return () => window.clearInterval(timer);
  }, [isSubmitting, loading.messages.length, loadingType]);

  async function analyzeUrl(nextUrl: string) {
    setUrl(nextUrl);
    setResult(null);
    setMessage("");
    setLoadingType(isChannelUrl(nextUrl) ? "channel" : "video");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: nextUrl, maxComments }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.detail ?? "분석을 요청하지 못했습니다.");
      setResult(payload as AnalysisResponse);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "분석을 요청하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeUrl(url);
  }

  const content = result ? (
    <Dashboard
      result={result}
      onReset={() => setResult(null)}
      onAnalyzeChannel={(channelId) =>
        analyzeUrl(`https://www.youtube.com/channel/${channelId}`)
      }
    />
  ) : isSubmitting ? (
    <main className="loading-page" role="status" aria-live="polite">
      <div className="loading-state">
        <p className="loading-kicker">{loading.kicker}</p>
        <span className="loading-orbit" aria-hidden="true" />
        <p className="loading-message">{loading.messages[loadingStep]}</p>
        <div
          className="loading-steps"
          aria-label={`${loadingStep + 1}단계 진행 중`}
        >
          {loading.messages.map((_, index) => (
            <span
              className={index <= loadingStep ? "is-active" : ""}
              key={index}
            />
          ))}
        </div>
        <p className="loading-note">{loading.note}</p>
      </div>
    </main>
  ) : (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-brand" aria-label="Channelytics">
          <span className="hero-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="hero-brand-name">
            Channel<b>ytics</b>
          </span>
        </div>
        <h1 id="page-title">채널 반응을 한눈에 분석하세요</h1>
        <p className="intro">
          채널이나 영상 링크를 입력하면 최근 성과와 시청자 반응을 보기 쉽게 정리해드립니다.
        </p>
      </section>
      <section className="analyzer-card" aria-label="YouTube 채널 분석">
        <form className="search-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="youtube-url">
            YouTube 채널 또는 영상 URL
          </label>
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="YouTube 영상 또는 채널 링크를 붙여넣으세요"
            required
            inputMode="url"
          />
          <button type="submit">
            분석하기 <span aria-hidden="true">→</span>
          </button>
        </form>
        {message && (
          <p className="request-message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );

  return <AdSupportedLayout>{content}</AdSupportedLayout>;
}
