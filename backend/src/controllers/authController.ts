import { loginService } from "../services/authService";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const data = await loginService(input);

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}
