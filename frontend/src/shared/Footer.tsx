import Link from "next/link";

export function Footer() {
  return <footer className="site-footer">
    <p>© {new Date().getFullYear()} YouTube Analyzer</p>
    <nav aria-label="법적 고지">
      <Link href="/terms">이용약관</Link>
      <Link href="/privacy">개인정보처리방침</Link>
    </nav>
  </footer>;
}
