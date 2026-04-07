import { env } from "../config/env";
import type { AuthTokenPayload } from "../types/auth";
import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "12h";

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Token invalido");
  }

  return decoded as unknown as AuthTokenPayload;
}
