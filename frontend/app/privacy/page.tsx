import Link from "next/link";

export default function PrivacyPage() {
  return <main className="legal-page">
    <Link className="legal-back" href="/">← 분석 화면으로 돌아가기</Link>
    <p className="eyebrow">LEGAL</p>
    <h1>개인정보처리방침</h1>
    <p className="legal-notice">이 문서는 정식 서비스 출시 전 초안입니다. 광고·분석 도구·보관 정책과 사업자 정보가 확정된 뒤 실제 처리 현황에 맞게 수정해야 합니다.</p>
    <section><h2>처리할 수 있는 정보</h2><p>서비스 이용 과정에서 입력한 YouTube 채널 또는 영상 URL, 서비스 운영을 위한 접속 기록 등 최소한의 정보가 처리될 수 있습니다.</p></section>
    <section><h2>이용 목적</h2><p>입력된 URL은 채널·영상 분석 결과를 제공하기 위해서만 사용합니다.</p></section>
    <section><h2>광고 및 외부 서비스</h2><p>광고 또는 분석 도구를 도입하는 경우 쿠키, IP 주소 또는 광고 식별자 처리와 외부 서비스 제공 내역을 실제 사용 현황에 맞춰 별도로 고지합니다.</p></section>
    <section><h2>문의처</h2><p>정식 서비스 출시 전 운영자 연락처와 개인정보 관련 문의 방법을 추가합니다.</p></section>
  </main>;
}
