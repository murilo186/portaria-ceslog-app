import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-900">Dashboard</h1>
        <p className="text-sm text-text-700">Acompanhe e continue o relatório diário da portaria.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-900">Novo relatório</h2>
            <p className="mt-1 text-sm text-text-700">Inicia um novo registro para o dia atual.</p>
          </div>
          <Button onClick={() => navigate("/relatorio")}>Novo relatório</Button>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-900">Continuar relatório do dia</h2>
            <p className="mt-1 text-sm text-text-700">
              Retoma o relatório diário já existente para seguir com os lançamentos.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/relatorio")}>
            Continuar relatório do dia
          </Button>
        </Card>
      </div>
    </div>
  );
}
