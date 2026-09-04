import Link from "next/link";
import { createPageMetadata } from "../../src/shared/seo";

export const metadata = createPageMetadata({
  title: "서비스 소개",
  description:
    "Channelytics가 공개 유튜브 채널의 최근 영상 성과와 댓글 반응을 어떻게 정리하는지 소개합니다.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← 분석 화면으로 돌아가기
      </Link>
      <p className="eyebrow">ABOUT</p>
      <h1>서비스 소개</h1>
      <p className="legal-lead">
        Channelytics는 공개된 채널과 영상 데이터를 한눈에 살펴보고,
        시청자 반응에서 다음 콘텐츠의 단서를 찾는 분석 도구입니다.
      </p>
      <section>
        <h2>채널 분석</h2>
        <p>
          공개 채널 통계와 최근 영상의 조회수·좋아요·댓글 데이터를 바탕으로
          콘텐츠 흐름과 반응이 확인된 주제를 정리합니다.
        </p>
      </section>
      <section>
        <h2>영상 분석</h2>
        <p>
          공개 댓글을 긍정 반응, 질문, 콘텐츠 요청, 불만 등으로 분류하고
          반복되는 의견과 콘텐츠 아이디어를 근거 댓글과 함께 제공합니다.
        </p>
      </section>
      <section>
        <h2>독립 서비스 안내</h2>
        <p>
          이 서비스는 YouTube 또는 Google이 제공하거나 보증하는 공식 서비스가
          아니며, YouTube Data API를 통해 제공되는 공개 데이터를 사용합니다.
        </p>
      </section>
    </main>
  );
}
