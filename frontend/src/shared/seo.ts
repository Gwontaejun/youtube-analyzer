import type { Metadata } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";

function resolveSiteUrl() {
  const configuredUrl = process.env.SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const candidate = configuredUrl || (vercelUrl ? `https://${vercelUrl}` : DEFAULT_SITE_URL);

  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "Channelytics",
  title: "Channelytics | 유튜브 채널·영상 분석",
  description:
    "유튜브 채널의 최근 영상 성과와 영상 댓글 반응을 분석해 콘텐츠 흐름과 시청자 요구를 보여주는 채널 분석 서비스입니다.",
  url: resolveSiteUrl(),
  locale: "ko_KR",
} as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: `/${string}`;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: path,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} 채널·영상 분석 서비스`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: ["/opengraph-image"],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.url}/`).toString();
}
