import { Alert } from "@mui/material";

type FeedbackTone = "success" | "error" | "warning" | "info";
type LiveMode = "polite" | "assertive" | "off";

type FeedbackMessageProps = {
  message: string;
  tone?: FeedbackTone;
  className?: string;
  liveMode?: LiveMode;
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
    <Alert
      severity={tone}
      variant="outlined"
      role={resolvedLiveMode === "off" ? undefined : role}
      aria-live={resolvedLiveMode}
      aria-atomic="true"
      className={className}
      sx={{ py: 0.25 }}
    >
      {message}
    </Alert>
  );
}
