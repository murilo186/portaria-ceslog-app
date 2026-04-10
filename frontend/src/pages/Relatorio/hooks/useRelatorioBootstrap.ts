import { getRelatorioAberto } from "../../../services/relatorioService";
import { getAuthSession } from "../../../services/authStorage";
import { ApiError } from "../../../services/api";
import { getUserErrorMessage } from "../../../services/errorService";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;

    setUsuarioLogado(authSession.usuario);
    setToken(authSession.token);
    setTurnoAtual(authSession.usuario.turno ?? "-");

    async function loadRelatorio() {
      try {
        const relatorio = await getRelatorioAberto(authSession.token);
        setRelatorioId(relatorio.id);
        setRelatorioStatus(relatorio.status);
        setItens(relatorio.itens);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate("/dashboard", {
            replace: true,
            state: { message: "Não existe relatório em aberto para continuar." },
          });
          return;
        }

        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Erro ao carregar relatório"),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadRelatorio();
  }, [navigate, setFeedback]);

  return {
    itens,
    setItens,
    relatorioId,
    relatorioStatus,
    setRelatorioStatus,
    turnoAtual,
    usuarioLogado,
    token,
    isLoading,
  };
}
