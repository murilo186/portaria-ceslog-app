import type { NextFunction, Request, Response } from "express";

function nowInMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAtMs = nowInMs();

  res.on("finish", () => {
    const durationMs = Math.max(0, nowInMs() - startedAtMs);

    console.info("request_completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: req.user?.id ?? null,
      ip: req.ip,
    });
  });

  next();
}
