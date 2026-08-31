import { CategoryKey } from "../types/analysis";

export const categoryItems: Array<{ key: CategoryKey; label: string; emoji: string }> = [
  { key: "positive", label: "긍정", emoji: "😊" },
  { key: "question", label: "질문", emoji: "💬" },
  { key: "content_request", label: "콘텐츠 요청", emoji: "💡" },
  { key: "complaint", label: "불만", emoji: "🛠️" },
  { key: "toxic", label: "악성", emoji: "⚠️" },
  { key: "spam", label: "스팸", emoji: "🚫" },
  { key: "other", label: "기타", emoji: "📌" },
];
