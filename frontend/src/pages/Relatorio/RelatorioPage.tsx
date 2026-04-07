import Button from "../../components/Button";
import Card from "../../components/Card";

const colunas = ["Horário", "Ocorrência", "Responsável", "Turno", "Ações"];

export default function RelatorioPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Relatório do Dia</h1>
          <p className="text-sm text-text-700">Registros operacionais diários da portaria.</p>
        </div>

        <Button>Adicionar novo registro</Button>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                {colunas.map((coluna) => (
                  <th
                    key={coluna}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700"
                  >
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-700">
                  Nenhum registro adicionado até o momento.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
