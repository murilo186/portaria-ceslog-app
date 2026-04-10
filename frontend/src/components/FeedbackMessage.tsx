type FeedbackTone = "success" | "error" | "warning" | "info";

type FeedbackMessageProps = {
  message: string;
  tone?: FeedbackTone;
  className?: string;
};

const toneClassNameMap: Record<FeedbackTone, string> = {
  success: "text-emerald-700",
  error: "text-red-600",
  warning: "text-amber-700",
  info: "text-text-700",
};

export default function FeedbackMessage({ message, tone = "info", className = "" }: FeedbackMessageProps) {
  return <p className={`text-sm ${toneClassNameMap[tone]} ${className}`.trim()}>{message}</p>;
}