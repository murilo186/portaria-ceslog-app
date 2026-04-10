import Button from "../../../components/Button";
import Card from "../../../components/Card";

type AdminRegistrosAccessCardProps = {
  onGoRegistros: () => void;
};

export default function AdminRegistrosAccessCard({ onGoRegistros }: AdminRegistrosAccessCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-text-900">Lista de registros</h2>
        <p className="text-sm text-text-700">Acesse o histórico completo de relatórios fechados.</p>
        <Button type="button" variant="secondary" onClick={onGoRegistros}>
          Abrir registros
        </Button>
      </Card>
    </div>
  );
}