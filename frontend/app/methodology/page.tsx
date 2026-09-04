import Link from "next/link";

export default function MethodologyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← 분석 화면으로 돌아가기
      </Link>
      <p className="eyebrow">METHODOLOGY</p>
      <h1>분석 기준</h1>
      <p className="legal-lead">
        화면에 표시되는 수치와 AI 인사이트가 어떤 데이터를 기준으로 만들어지는지
        안내합니다.
      </p>
      <section>
        <h2>채널 분석 범위</h2>
        <p>
          현재 공개된 채널 통계와 최근 28일 동안 업로드된 공개 영상을 사용합니다.
          차트는 영상별 현재 누적 조회수를 업로드 날짜 기준으로 묶은 값이며,
          과거 일별 조회수나 채널 성장률을 의미하지 않습니다.
        </p>
      </section>
      <section>
        <h2>영상 댓글 분석 범위</h2>
        <p>
          영상당 최대 1,000개의 공개 최상위 댓글을 수집합니다. 채널 운영자가
          작성한 댓글, 빈 댓글과 중복 댓글은 분석 대상에서 제외합니다.
        </p>
      </section>
      <section>
        <h2>AI 분석 방식</h2>
        <p>
          전처리된 댓글은 카테고리·주제·감정으로 분류되고, 숫자 집계는 서버에서
          계산합니다. 최종 요약과 콘텐츠 아이디어는 집계 결과를 기반으로
          생성하며, 주요 주제에는 근거가 된 댓글을 함께 표시합니다.
        </p>
      </section>
      <section>
        <h2>해석할 때의 주의사항</h2>
        <p>
          공개 API에서 제공되지 않는 시청 지속 시간, 클릭률, 수익, 유입 경로와
          시청자 인구통계는 분석하지 않습니다. AI 결과는 참고 정보이며 문맥에
          따라 분류나 요약이 달라질 수 있습니다.
        </p>
      </section>
    </main>
  );
}
