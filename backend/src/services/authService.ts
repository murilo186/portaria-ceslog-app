import { authRepository } from "../repositories/authRepository";
import { signToken } from "../lib/jwt";
import { createOrReplaceUserSession } from "./sessionService";
import { createAuthService } from "./auth/createAuthService";
import bcrypt from "bcryptjs";

const authService = createAuthService({
  repository: authRepository,
  passwordComparer: {
    compare: (plain, hash) => bcrypt.compare(plain, hash),
  },
  sessionIssuer: {
    createOrReplaceUserSession,
  },
  tokenSigner: {
    signToken,
  },
});

export const loginService = authService.loginService;
