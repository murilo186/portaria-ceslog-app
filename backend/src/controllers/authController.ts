import { createAuditLog } from "../services/auditService";
import { loginService } from "../services/authService";
import { getRequestMetadata } from "../utils/requestMetadata";
import { loginSchema } from "../validation/authSchemas";
import { asyncHandler } from "./helpers/asyncHandler";

export const loginController = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const data = await loginService({
    usuario: input.usuario,
    senha: input.senha,
  });

  await createAuditLog({
    usuarioId: data.usuario.id,
    usuarioNome: data.usuario.nome,
    usuarioLogin: data.usuario.usuario,
    acao: "AUTH_LOGIN_SUCCESS",
    entidade: "AUTH",
    descricao: "Login realizado com sucesso.",
    detalhes: {
      perfil: data.usuario.perfil,
      turno: data.usuario.turno,
    },
    contexto: getRequestMetadata(req),
  });

  return res.status(200).json(data);
});
