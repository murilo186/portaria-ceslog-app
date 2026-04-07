import { emitAuthRequired } from "./authEvents";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "FORBIDDEN_ITEM_OWNER"
  | "REPORT_CLOSED"
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "INTERNAL_ERROR"
  | string;

export class ApiError extends Error {
  status: number;
  code?: ApiErrorCode;

  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type RequestConfig = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

type ErrorResponseBody = {
  message?: string;
  code?: ApiErrorCode;
};

export async function apiRequest<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const normalizedBase = apiUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalPath =
    normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")
      ? normalizedPath.replace(/^\/api/, "")
      : normalizedPath;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(`${normalizedBase}${finalPath}`, {
    method: config.method ?? "GET",
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Erro na requisição";
    let code: ApiErrorCode | undefined;

    try {
      const errorBody = (await response.json()) as ErrorResponseBody;
      if (errorBody.message) {
        message = errorBody.message;
      }
      code = errorBody.code;
    } catch {
      // noop
    }

    if (response.status === 401) {
      emitAuthRequired({
        reason: code === "TOKEN_EXPIRED" ? "expired" : "unauthorized",
        message,
      });
    }

    throw new ApiError(message, response.status, code);
  }

  return (await response.json()) as T;
}

