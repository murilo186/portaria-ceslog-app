import type { Request } from "express";

function readForwardedIp(req: Request): string | null {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    return firstIp || null;
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    const firstIp = forwardedFor[0]?.trim();
    return firstIp || null;
  }

  return null;
}

export function getRequestMetadata(req: Request) {
  const forwardedIp = readForwardedIp(req);
  const userAgent = req.headers["user-agent"]?.trim() ?? null;

  return {
    ip: forwardedIp ?? req.ip ?? null,
    userAgent,
    requestId: req.requestId ?? null,
  };
}
