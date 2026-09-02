"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChannelVideo } from "../../../types/analysis";

type ChartMode = "all" | "long-form" | "shorts";
type ChartDatum = {
  date: string;
  label: string;
  longForm: number | null;
  shorts: number | null;
  videos: ChannelVideo[];
  longFormVideos: ChannelVideo[];
  shortVideos: ChannelVideo[];
};
type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartDatum }>;
  mode: ChartMode;
};

const DAY_COUNT = 28;

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function ChannelChartTooltip({ active, payload, mode }: ChartTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const videos =
    mode === "long-form"
      ? point.longFormVideos
      : mode === "shorts"
        ? point.shortVideos
        : point.videos;
  if (!videos.length) return null;

  const displayedVideos = videos.slice(0, 5);
  return (
    <div className="channel-chart-tooltip">
      <strong className="channel-chart-tooltip-date">{formatFullDate(point.date)}</strong>
      <div className="channel-chart-tooltip-totals">
        {(mode === "all" || mode === "long-form") && point.longForm !== null ? (
          <span className="is-long-form">
            롱폼 <b>{formatCount(point.longForm)}</b>
          </span>
        ) : null}
        {(mode === "all" || mode === "shorts") && point.shorts !== null ? (
          <span className="is-shorts">
            Shorts <b>{formatCount(point.shorts)}</b>
          </span>
        ) : null}
      </div>
      <p className="channel-chart-tooltip-count">
        롱폼 {point.longFormVideos.length}개 · Shorts {point.shortVideos.length}개
      </p>
      <div className="channel-chart-tooltip-videos">
        {displayedVideos.map((video) => {
          const isShorts = video.durationSeconds > 0 && video.durationSeconds <= 180;
          return (
            <div className="channel-chart-tooltip-video" key={video.id}>
              {video.thumbnail ? (
                <Image src={video.thumbnail} alt="" width={72} height={41} />
              ) : (
                <span className="channel-chart-tooltip-placeholder">▶</span>
              )}
              <div>
                <span className={isShorts ? "is-shorts" : "is-long-form"}>
                  {isShorts ? "SHORTS" : "LONG"}
                </span>
                <strong>{video.title}</strong>
              </div>
            </div>
          );
        })}
      </div>
      {videos.length > displayedVideos.length ? (
        <p className="channel-chart-tooltip-more">
          외 {videos.length - displayedVideos.length}개 영상
        </p>
      ) : null}
    </div>
  );
}

function createChartData(videos: ChannelVideo[]) {
  const today = new Date();
  const totals = new Map<
    string,
    {
      longForm: number;
      shorts: number;
      longFormVideos: ChannelVideo[];
      shortVideos: ChannelVideo[];
    }
  >();

  for (const video of videos) {
    const key = video.publishedAt.slice(0, 10);
    const current = totals.get(key) ?? {
      longForm: 0,
      shorts: 0,
      longFormVideos: [],
      shortVideos: [],
    };
    if (video.durationSeconds > 0 && video.durationSeconds <= 180) {
      current.shorts += video.viewCount;
      current.shortVideos.push(video);
    } else {
      current.longForm += video.viewCount;
      current.longFormVideos.push(video);
    }
    totals.set(key, current);
  }

  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - (DAY_COUNT - 1 - index),
      ),
    );
    const key = utcDateKey(date);
    const values = totals.get(key);
    return {
      date: key,
      label: `${date.getUTCMonth() + 1}.${date.getUTCDate()}`,
      longForm: values?.longFormVideos.length ? values.longForm : null,
      shorts: values?.shortVideos.length ? values.shorts : null,
      videos: values ? [...values.longFormVideos, ...values.shortVideos] : [],
      longFormVideos: values?.longFormVideos ?? [],
      shortVideos: values?.shortVideos ?? [],
    };
  }) satisfies ChartDatum[];
}

export function ChannelPerformanceChart({ videos }: { videos: ChannelVideo[] }) {
  const [mode, setMode] = useState<ChartMode>("all");
  const chartData = useMemo(() => createChartData(videos), [videos]);
  const totals = useMemo(
    () =>
      videos.reduce(
        (result, video) => {
          result.all += video.viewCount;
          if (video.durationSeconds > 0 && video.durationSeconds <= 180) {
            result.shorts += video.viewCount;
          } else {
            result.longForm += video.viewCount;
          }
          return result;
        },
        { all: 0, longForm: 0, shorts: 0 },
      ),
    [videos],
  );

  return (
    <section className="channel-performance" aria-labelledby="channel-performance-title">
      <div className="channel-performance-header">
        <div>
          <p className="eyebrow">28 DAY PERFORMANCE</p>
          <h2 id="channel-performance-title">최근 28일 업로드 영상 성과</h2>
          <div className="channel-performance-total">
            <strong>{formatCount(totals.all)}</strong>
            <span>현재 누적 조회수</span>
          </div>
          <div className="channel-performance-legend" aria-label="포맷별 누적 조회수">
            <span className="is-long-form">
              롱폼 <b>{formatCount(totals.longForm)}</b>
            </span>
            <span className="is-shorts">
              Shorts <b>{formatCount(totals.shorts)}</b>
            </span>
          </div>
        </div>
        <div className="channel-chart-tabs" role="tablist" aria-label="차트 영상 형식">
          {([
            ["all", "전체"],
            ["long-form", "롱폼"],
            ["shorts", "Shorts"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? "is-active" : ""}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {videos.length ? (
        <div className="channel-performance-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
              <defs>
                <linearGradient id="longFormArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8fa5ff" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#8fa5ff" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="shortsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff8b68" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#ff8b68" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ffffff18" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                tick={{ fill: "#8f8b99", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCount}
                width={48}
                tick={{ fill: "#8f8b99", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: "#ffffff2d", strokeWidth: 1 }}
                content={<ChannelChartTooltip mode={mode} />}
                wrapperStyle={{ zIndex: 20, outline: "none" }}
              />
              {(mode === "all" || mode === "long-form") && (
                <Area
                  type="linear"
                  dataKey="longForm"
                  name="롱폼"
                  connectNulls
                  stroke="#8fa5ff"
                  strokeWidth={2.5}
                  strokeLinejoin="miter"
                  fill="url(#longFormArea)"
                  dot={{ r: 3, strokeWidth: 0, fill: "#8fa5ff" }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#171920" }}
                />
              )}
              {(mode === "all" || mode === "shorts") && (
                <Area
                  type="linear"
                  dataKey="shorts"
                  name="Shorts"
                  connectNulls
                  stroke="#ff8b68"
                  strokeWidth={2.5}
                  strokeLinejoin="miter"
                  fill="url(#shortsArea)"
                  dot={{ r: 3, strokeWidth: 0, fill: "#ff8b68" }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#171920" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="channel-performance-empty">최근 28일 동안 업로드된 영상을 찾지 못했습니다.</p>
      )}
      <p className="channel-performance-note">
        각 날짜에 업로드된 영상이 현재까지 기록한 누적 조회수입니다.
      </p>
    </section>
  );
}
