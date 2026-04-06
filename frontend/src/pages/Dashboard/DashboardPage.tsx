import { getAuthSession } from "../../services/authStorage";
import { getRelatorioHoje } from "../../services/relatorioService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenRelatorio = async () => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await getRelatorioHoje(auth.token);
      navigate("/relatorio");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel abrir o relatorio";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-900">Dashboard</h1>
        <p className="text-sm text-text-700">Acompanhe e continue o relatorio diario da portaria.</p>
        {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-900">Novo relatorio</h2>
            <p className="mt-1 text-sm text-text-700">Cria o relatorio do dia se ainda nao existir.</p>
          </div>
          <Button onClick={() => void handleOpenRelatorio()} disabled={isLoading}>
            {isLoading ? "Abrindo..." : "Novo relatorio"}
          </Button>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-900">Continuar relatorio do dia</h2>
            <p className="mt-1 text-sm text-text-700">
              Retoma o relatorio diario existente para seguir com os lancamentos.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void handleOpenRelatorio()} disabled={isLoading}>
            Continuar relatorio do dia
          </Button>
        </Card>
      </div>
    </div>
  );
}
