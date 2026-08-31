import Link from "next/link";

export default function TermsPage() {
  return <main className="legal-page">
    <Link className="legal-back" href="/">← 분석 화면으로 돌아가기</Link>
    <p className="eyebrow">LEGAL</p>
    <h1>이용약관</h1>
    <p className="legal-notice">이 문서는 정식 서비스 출시 전 초안입니다. 실제 운영 전 사업자 정보와 서비스 정책을 반영해 검토·확정해야 합니다.</p>
    <section><h2>서비스 목적</h2><p>YouTube Analyzer는 공개된 YouTube 채널 및 영상의 댓글 데이터를 분석해 채널 운영에 참고할 수 있는 인사이트를 제공합니다.</p></section>
    <section><h2>분석 결과의 성격</h2><p>분석 결과는 AI 기반 참고 정보이며, 완전성·정확성 또는 특정 성과를 보장하지 않습니다.</p></section>
    <section><h2>서비스 변경</h2><p>서비스 기능, 제공 범위 및 이용 조건은 운영상 필요에 따라 변경될 수 있습니다.</p></section>
  </main>;
}
