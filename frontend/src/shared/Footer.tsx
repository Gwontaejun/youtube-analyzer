import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <p>© {new Date().getFullYear()} Channelytics</p>
        <span>YouTube의 공식 서비스가 아닌 독립 분석 도구입니다.</span>
      </div>
      <div className="footer-link-groups">
        <nav aria-label="서비스 안내">
          <Link href="/about">서비스 소개</Link>
          <Link href="/methodology">분석 기준</Link>
          <a
            href="https://github.com/Gwontaejun/youtube-analyzer/issues"
            target="_blank"
            rel="noreferrer"
          >
            문의·피드백
          </a>
        </nav>
        <nav aria-label="약관 및 개인정보">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noreferrer"
          >
            YouTube 이용약관
          </a>
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            광고 설정
          </a>
        </nav>
      </div>
    </footer>
  );
}
