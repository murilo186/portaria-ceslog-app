import { getAuthSession } from "../../services/authStorage";
import { listRelatorios } from "../../services/relatorioService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { RelatorioResumo } from "../../types/relatorio";

function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function RegistrosPage() {
  const navigate = useNavigate();
  const [registrosFechados, setRegistrosFechados] = useState<RelatorioResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;

    async function loadRegistros() {
      try {
        const relatorios = await listRelatorios(authSession.token);
        const fechados = relatorios.filter((item) => item.status === "FECHADO");
        setRegistrosFechados(fechados);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar registros";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadRegistros();
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button type="button" variant="secondary" className="mb-2 px-3 py-2 text-xs" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold text-text-900">Registros Fechados</h1>
        <p className="text-sm text-text-700">Lista basica de registros no formato REGISTRO - DATA.</p>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>

      <Card className="p-0">
        <div className="divide-y divide-surface-200">
          {isLoading ? (
            <p className="px-4 py-6 text-sm text-text-700">Carregando...</p>
          ) : registrosFechados.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-700">Nenhum registro fechado encontrado.</p>
          ) : (
            registrosFechados.map((registro) => (
              <button
                key={registro.id}
                type="button"
                onClick={() => navigate(`/registros/${registro.id}`)}
                className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-surface-50"
              >
                <span className="text-sm font-semibold text-text-900">
                  REGISTRO - {formatDate(registro.dataRelatorio)}
                </span>
                <span className="text-xs text-text-700">Abrir</span>
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
