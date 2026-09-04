import Link from "next/link";
import { createPageMetadata } from "../../src/shared/seo";

export const metadata = createPageMetadata({
  title: "개인정보처리방침",
  description: "Channelytics 서비스의 개인정보 및 광고 데이터 처리 방침입니다.",
  path: "/privacy",
  noIndex: true,
});

export default function PrivacyPage() {
  return <main className="legal-page">
    <Link className="legal-back" href="/">← 분석 화면으로 돌아가기</Link>
    <p className="eyebrow">LEGAL</p>
    <h1>개인정보처리방침</h1>
    <p className="legal-notice">이 문서는 정식 서비스 출시 전 초안입니다. 보관 정책과 사업자 정보가 확정된 뒤 실제 처리 현황에 맞게 수정해야 합니다.</p>
    <section><h2>처리할 수 있는 정보</h2><p>서비스 이용 과정에서 입력한 YouTube 채널 또는 영상 URL, 서비스 운영을 위한 접속 기록 등 최소한의 정보가 처리될 수 있습니다.</p></section>
    <section><h2>이용 목적</h2><p>입력된 URL은 채널·영상 분석 결과를 제공하기 위해서만 사용합니다.</p></section>
    <section><h2>YouTube API 서비스</h2><p>서비스는 공개 채널, 영상 및 댓글 정보를 조회하기 위해 YouTube API 서비스를 사용합니다. YouTube API를 통해 제공받은 데이터에는 <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google 개인정보처리방침</a>이 적용될 수 있습니다.</p><p>현재 서비스는 사용자의 YouTube 계정 로그인을 요구하지 않습니다. 추후 계정 연동 기능이 추가되는 경우 사용자는 <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noreferrer">Google 계정 권한 설정</a>에서 접근 권한을 확인하거나 철회할 수 있습니다.</p></section>
    <section><h2>Google AdSense 및 광고 쿠키</h2><p>서비스는 광고 제공을 위해 Google AdSense를 사용할 수 있습니다. Google을 포함한 제3자 광고 사업자는 사용자의 이전 방문 기록을 바탕으로 광고를 제공하기 위해 쿠키를 사용할 수 있으며, 이 과정에서 IP 주소, 브라우저·기기 정보 및 광고 상호작용 정보가 처리될 수 있습니다.</p><p>사용자는 <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google 광고 설정</a>에서 맞춤 광고를 관리하거나 사용 중지할 수 있습니다. 자세한 내용은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">Google의 광고 데이터 사용 안내</a>에서 확인할 수 있습니다.</p></section>
    <section><h2>국외 이용자 동의</h2><p>유럽경제지역(EEA), 영국 또는 스위스 이용자에게 광고를 제공하는 경우 Google이 인증한 동의 관리 플랫폼(CMP)을 통해 필요한 선택권과 동의 절차를 제공합니다.</p></section>
    <section><h2>문의처</h2><p>서비스 및 개인정보 관련 문의는 <a href="https://github.com/Gwontaejun/youtube-analyzer/issues" target="_blank" rel="noreferrer">GitHub 문의·피드백 페이지</a>를 통해 접수할 수 있습니다. 정식 서비스 출시 전 운영자 정보를 추가합니다.</p></section>
  </main>;
}
