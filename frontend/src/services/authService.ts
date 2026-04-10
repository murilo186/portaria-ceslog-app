import { apiRequestWithSchema } from "./api";
import { loginResponseSchema } from "./contracts";
import type { LoginRequest, LoginResponse } from "../types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequestWithSchema("/api/auth/login", loginResponseSchema, {
    method: "POST",
    body: payload,
  });
}
