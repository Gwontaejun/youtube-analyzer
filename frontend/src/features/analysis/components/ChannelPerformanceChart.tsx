"use client";

import Image from "next/image";
import {
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  MouseHandlerDataParam,
  ReferenceLine,
  ResponsiveContainer,
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
type ActiveTooltip = {
  point: ChartDatum;
  left: number;
  top: number;
};
type ChartTooltipProps = {
  point: ChartDatum;
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

function videosForMode(point: ChartDatum, mode: ChartMode) {
  return mode === "long-form"
    ? point.longFormVideos
    : mode === "shorts"
      ? point.shortVideos
      : point.videos;
}

function ChannelChartTooltip({ point, mode }: ChartTooltipProps) {
  const videos = videosForMode(point, mode);

  const displayedVideos = videos.slice(0, 5);
  return (
    <div className="channel-chart-tooltip">
      <strong className="channel-chart-tooltip-date">
        {formatFullDate(point.date)}
      </strong>
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
        롱폼 {point.longFormVideos.length}개 · Shorts {point.shortVideos.length}
        개
      </p>
      <div className="channel-chart-tooltip-videos">
        {displayedVideos.map((video) => {
          const isShorts =
            video.durationSeconds > 0 && video.durationSeconds <= 180;
          return (
            <a
              className="channel-chart-tooltip-video"
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`}
              target="_blank"
              rel="noreferrer"
              key={video.id}
            >
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
            </a>
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

export function ChannelPerformanceChart({
  videos,
}: {
  videos: ChannelVideo[];
}) {
  const [mode, setMode] = useState<ChartMode>("all");
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(
    null,
  );
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const hideTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chartData = useMemo(() => createChartData(videos), [videos]);
  const chartDomainMax = useMemo(() => {
    const values = chartData.flatMap((point) => {
      if (mode === "long-form") return [point.longForm ?? 0];
      if (mode === "shorts") return [point.shorts ?? 0];
      return [point.longForm ?? 0, point.shorts ?? 0];
    });
    return Math.max(...values, 1) * 1.12;
  }, [chartData, mode]);
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

  function cancelTooltipHide() {
    if (hideTooltipTimer.current) {
      clearTimeout(hideTooltipTimer.current);
      hideTooltipTimer.current = null;
    }
  }

  function scheduleTooltipHide(delay = 450) {
    cancelTooltipHide();
    hideTooltipTimer.current = setTimeout(() => setActiveTooltip(null), delay);
  }

  function showTooltip(
    state: MouseHandlerDataParam,
    event: ReactMouseEvent<SVGGraphicsElement>,
  ) {
    const index = Number(state.activeTooltipIndex);
    const point = chartData[index];
    const container = chartContainerRef.current;
    if (!point || !container || !videosForMode(point, mode).length) return;

    cancelTooltipHide();
    const bounds = container.getBoundingClientRect();
    const pointX = state.activeCoordinate?.x ?? bounds.width / 2;
    const visibleValues =
      mode === "long-form"
        ? [point.longForm]
        : mode === "shorts"
          ? [point.shorts]
          : [point.longForm, point.shorts];
    const pointValue = Math.max(
      ...visibleValues.filter((value): value is number => value !== null),
    );
    const plotTop = 16;
    const xAxisHeight = 30;
    const plotHeight = bounds.height - plotTop - xAxisHeight;
    const pointY = plotTop + plotHeight * (1 - pointValue / chartDomainMax);
    const pointerY = event.clientY - bounds.top;
    const tooltipWidth = Math.min(330, bounds.width - 24);
    const left = Math.min(
      Math.max(8, pointX - tooltipWidth / 2),
      bounds.width - tooltipWidth - 8,
    );
    const top = Math.min(pointY, pointerY) - 12;
    setActiveTooltip((current) =>
      current?.point.date === point.date ? current : { point, left, top },
    );
  }

  useEffect(
    () => () => {
      if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
    },
    [],
  );

  return (
    <section
      className="channel-performance"
      aria-labelledby="channel-performance-title"
    >
      <div className="channel-performance-header">
        <div>
          <p className="eyebrow">28 DAY PERFORMANCE</p>
          <h2 id="channel-performance-title">최근 28일 업로드 영상 성과</h2>
          <div className="channel-performance-total">
            <strong>{formatCount(totals.all)}</strong>
            <span>28일 누적 조회수</span>
          </div>
          <div
            className="channel-performance-legend"
            aria-label="포맷별 누적 조회수"
          >
            <span className="is-long-form">
              롱폼 <b>{formatCount(totals.longForm)}</b>
            </span>
            <span className="is-shorts">
              Shorts <b>{formatCount(totals.shorts)}</b>
            </span>
          </div>
        </div>
        <div
          className="channel-chart-tabs"
          role="tablist"
          aria-label="차트 영상 형식"
        >
          {(
            [
              ["all", "전체"],
              ["long-form", "롱폼"],
              ["shorts", "Shorts"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? "is-active" : ""}
              onClick={() => {
                setMode(value);
                setActiveTooltip(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {videos.length ? (
        <div className="channel-performance-chart" ref={chartContainerRef}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              onMouseMove={showTooltip}
              onClick={showTooltip}
              onMouseLeave={() => scheduleTooltipHide()}
            >
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
                height={30}
                minTickGap={24}
                tick={{ fill: "#8f8b99", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCount}
                domain={[0, chartDomainMax]}
                width={48}
                tick={{ fill: "#8f8b99", fontSize: 11 }}
              />
              {activeTooltip ? (
                <ReferenceLine
                  x={activeTooltip.point.label}
                  stroke="#ffffff33"
                  strokeWidth={1}
                />
              ) : null}
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
          {activeTooltip ? (
            <div
              className="channel-chart-tooltip-popover is-above"
              style={{ left: activeTooltip.left, top: activeTooltip.top }}
              onMouseEnter={cancelTooltipHide}
              onMouseLeave={() => scheduleTooltipHide(180)}
            >
              <ChannelChartTooltip point={activeTooltip.point} mode={mode} />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="channel-performance-empty">
          최근 28일 동안 업로드된 영상을 찾지 못했습니다.
        </p>
      )}
      <p className="channel-performance-note">
        각 날짜에 업로드된 영상이 현재까지 기록한 누적 조회수입니다.
      </p>
    </section>
  );
}
