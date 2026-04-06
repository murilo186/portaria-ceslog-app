import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

const SENSITIVE_KEYS = new Set(["senha", "password", "token", "authorization"]);

type ErrorDetails = {
  [key: string]: unknown;
};

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: ErrorDetails;

  constructor(message: string, statusCode = 400, code = "APP_ERROR", details?: ErrorDetails) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function sanitizeBody(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeBody(item));
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, currentValue]) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      return [key, "[REDACTED]"];
    }

    return [key, sanitizeBody(currentValue)];
  });

  return Object.fromEntries(entries);
}

function logError(error: unknown, req: Request, statusCode: number, code: string) {
  console.error("request_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    userId: req.user?.id,
    query: req.query,
    params: req.params,
    body: sanitizeBody(req.body),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export function errorMiddleware(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    const statusCode = 400;
    const code = "VALIDATION_ERROR";

    logError(error, req, statusCode, code);

    return res.status(statusCode).json({
      message: "Dados inválidos",
      code,
      issues: error.issues,
    });
  }

  if (error instanceof AppError) {
    logError(error, req, error.statusCode, error.code);

    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  const fallbackMessage = error instanceof Error ? error.message : "Erro interno";
  const statusCode = 500;
  const code = "INTERNAL_ERROR";

  logError(error, req, statusCode, code);

  return res.status(statusCode).json({
    message: fallbackMessage,
    code,
  });
}

