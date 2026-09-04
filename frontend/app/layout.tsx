import type { Metadata } from "next";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/dashboard.css";
import "./styles/ads.css";
import "./styles/footer-and-legal.css";
import { Footer } from "../src/shared/Footer";

export const metadata: Metadata = {
  title: "Channelytics",
  description: "YouTube 채널과 영상의 공개 데이터 및 시청자 반응 분석",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="app-body">{children}<Footer /></body></html>;
}
