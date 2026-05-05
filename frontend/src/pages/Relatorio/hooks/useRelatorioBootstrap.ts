import { useQuery } from "@tanstack/react-query";
import { getRelatorioAberto } from "../../../services/relatorioService";
import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { queryKeys } from "../../../services/queryKeys";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import type { RelatorioItem } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import type { FeedbackState } from "../types";

type UseRelatorioBootstrapParams = {
  setFeedback: Dispatch<SetStateAction<FeedbackState | null>>;
};

export function useRelatorioBootstrap({ setFeedback }: UseRelatorioBootstrapParams) {
  const navigate = useNavigate();

  const [itens, setItens] = useState<RelatorioItem[]>([]);
  const [relatorioId, setRelatorioId] = useState<number | null>(null);
  const [relatorioStatus, setRelatorioStatus] = useState<"ABERTO" | "FECHADO">("ABERTO");
  const [turnoAtual, setTurnoAtual] = useState<string>("-");
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const authSession = getAuthSession();

  useEffect(() => {
    if (!authSession) {
      navigate("/");
      return;
    }

    setUsuarioLogado(authSession.usuario);
    setToken(authSession.token);
    setTurnoAtual(authSession.usuario.turno ?? "-");
  }, [authSession, navigate]);

  const openReportQuery = useQuery({
    queryKey: queryKeys.openReport(authSession?.usuario.tenant.id ?? 0, authSession?.usuario.id ?? 0),
    enabled: Boolean(authSession),
    queryFn: () => getRelatorioAberto(authSession!.token),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!openReportQuery.isSuccess) {
      return;
    }

    const openReport = openReportQuery.data;

    if (!openReport) {
      navigate("/dashboard", {
        replace: true,
        state: { message: "Nao existe relatorio em aberto para continuar." },
      });
      return;
    }

    setRelatorioId(openReport.id);
    setRelatorioStatus(openReport.status);
    setItens(openReport.itens);
  }, [navigate, openReportQuery.data, openReportQuery.isSuccess]);

  useEffect(() => {
    if (!openReportQuery.error) {
      return;
    }

    setFeedback({
      type: "error",
      message: getUserErrorMessage(openReportQuery.error, "Erro ao carregar relatorio"),
    });
  }, [openReportQuery.error, setFeedback]);

  return {
    itens,
    setItens,
    relatorioId,
    relatorioStatus,
    setRelatorioStatus,
    turnoAtual,
    usuarioLogado,
    token,
    isLoading: openReportQuery.isLoading,
  };
}
