const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestConfig = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
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
    let message = "Erro na requisicao";

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // noop
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
