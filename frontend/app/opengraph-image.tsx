import { ImageResponse } from "next/og";

export const alt = "Channelytics 유튜브 채널·영상 분석 서비스";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 82px",
          color: "#fffaf6",
          background:
            "linear-gradient(135deg, #17171d 0%, #211b25 48%, #26233f 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              height: 42,
              marginRight: 22,
            }}
          >
            <span style={{ width: 10, height: 30, marginRight: 7, background: "#ff765f" }} />
            <span style={{ width: 10, height: 21, marginRight: 7, background: "#e684cc" }} />
            <span style={{ width: 10, height: 38, background: "#8f89ff" }} />
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
            Channelytics
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#ff826f",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3,
              marginBottom: 22,
            }}
          >
            CHANNEL &amp; VIDEO ANALYSIS
          </span>
          <span style={{ fontSize: 67, fontWeight: 800, lineHeight: 1.15, letterSpacing: -4 }}>
            채널의 흐름과 시청자 반응을
          </span>
          <span style={{ fontSize: 67, fontWeight: 800, lineHeight: 1.15, letterSpacing: -4 }}>
            한눈에 확인하세요
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#c9c5cf",
            fontSize: 25,
          }}
        >
          최근 영상 성과 · 댓글 반응 · AI 인사이트
        </div>
      </div>
    ),
    size,
  );
}
