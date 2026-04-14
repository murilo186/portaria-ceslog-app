import { createAuditLog } from "../../services/auditService";
import { getRelatorioClockService, setRelatorioClockSimulationService } from "../../services/relatorioService";
import { RELATORIO_ERROR } from "../../services/relatorio/errors";
import { getRequestMetadata } from "../../utils/requestMetadata";
import { relatorioClockSimulationSchema } from "../../validation/relatorioSchemas";
import { asyncHandler } from "../helpers/asyncHandler";
import { ensureAuthenticatedUser } from "../helpers/ensureAuthenticatedUser";

export const getRelatorioClockController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const snapshot = getRelatorioClockService();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(200).json(snapshot);
});

export const setRelatorioClockSimulationController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);

  if (process.env.NODE_ENV === "production") {
    throw RELATORIO_ERROR.clockSimulationForbidden();
  }

  const { start } = relatorioClockSimulationSchema.parse(req.body);
  const snapshot = setRelatorioClockSimulationService(start ?? null);

  await createAuditLog({
    tenantId: user.tenantId,
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioLogin: user.usuario,
    acao: "CLOCK_SIMULATION_SET",
    entidade: "CLOCK",
    descricao: start ? "Horario de simulacao atualizado." : "Simulacao de horario desativada.",
    detalhes: {
      start: start ?? null,
    },
    contexto: getRequestMetadata(req),
  });

  return res.status(200).json(snapshot);
});
