export function formatDuration(totalSeconds: number) {
  if (!totalSeconds) return "길이 정보 없음";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}분 ${String(seconds).padStart(2, "0")}초` : `${seconds}초`;
}
