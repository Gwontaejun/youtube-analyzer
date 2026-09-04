"use client";

import Script from "next/script";

const adsenseClientId =
  process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID?.trim() ?? "";

export function MobileAnchorAd() {
  const isConfigured = /^ca-pub-\d+$/.test(adsenseClientId);

  if (!isConfigured) {
    if (process.env.NODE_ENV !== "development") return null;

    return (
      <aside className="mobile-anchor-ad mobile-anchor-ad-preview" aria-label="모바일 광고 미리보기">
        <span>광고</span>
        <strong>모바일 하단 광고 영역</strong>
      </aside>
    );
  }

  return (
    <div className="mobile-anchor-ad" aria-hidden="true">
      <Script
        id="google-adsense-mobile-anchor"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        data-overlays="bottom"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`}
      />
    </div>
  );
}
