import type { Metadata } from "next";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/dashboard.css";
import "./styles/footer-and-legal.css";
import { Footer } from "../src/shared/Footer";

export const metadata: Metadata = { title: "YouTube Analyzer", description: "YouTube channel insights" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="app-body">{children}<Footer /></body></html>;
}
