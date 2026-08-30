import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "YouTube Analyzer", description: "YouTube comment insights" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
