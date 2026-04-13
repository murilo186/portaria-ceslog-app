import { z } from "zod";

export const createUsuarioSchema = z.object({
  nome: z.string().trim().min(1, "Nome e obrigatorio").max(120, "Nome deve ter ate 120 caracteres"),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "Usuario invalido. Use 3 a 30 caracteres (a-z, 0-9, ponto, underline ou hifen)."),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100, "Senha deve ter ate 100 caracteres"),
  turno: z.enum(["MANHA", "TARDE"]),
});

export const deleteUsuarioParamsSchema = z.object({
  usuarioId: z.coerce.number().int().positive(),
});

export const updateSenhaSchema = z.object({
  novaSenha: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100, "Senha deve ter ate 100 caracteres"),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
