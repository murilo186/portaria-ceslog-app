import { loginService } from "../services/authService";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

const loginSchema = z.object({
  usuario: z.string().trim().min(1, "Informe o usuario"),
  senha: z.string().min(1),
});

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const data = await loginService({
      usuario: input.usuario,
      senha: input.senha,
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}
