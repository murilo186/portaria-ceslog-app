type FeedbackTone = "success" | "error" | "warning" | "info";
type LiveMode = "polite" | "assertive" | "off";

type FeedbackMessageProps = {
  message: string;
  tone?: FeedbackTone;
  className?: string;
  liveMode?: LiveMode;
};

const toneClassNameMap: Record<FeedbackTone, string> = {
  success: "text-emerald-700",
  error: "text-red-600",
  warning: "text-amber-700",
  info: "text-text-700",
};

const liveModeByTone: Record<FeedbackTone, Exclude<LiveMode, "off">> = {
  success: "polite",
  info: "polite",
  warning: "assertive",
  error: "assertive",
};

export default function FeedbackMessage({
  message,
  tone = "info",
  className = "",
  liveMode,
}: FeedbackMessageProps) {
  const resolvedLiveMode = liveMode ?? liveModeByTone[tone];
  const role = resolvedLiveMode === "assertive" ? "alert" : "status";

  return (
    <p
      role={resolvedLiveMode === "off" ? undefined : role}
      aria-live={resolvedLiveMode}
      aria-atomic="true"
      className={`text-sm ${toneClassNameMap[tone]} ${className}`.trim()}
    >
      {message}
    </p>
  );
}
