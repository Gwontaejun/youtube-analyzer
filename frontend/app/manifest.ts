import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Channelytics",
    short_name: "Channelytics",
    description:
      "유튜브 채널의 최근 영상 성과와 영상 댓글 반응을 분석하는 채널 분석 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#111117",
    theme_color: "#111117",
    lang: "ko-KR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
