import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Input from "../../../components/Input";

type RegistroDetalheFiltersCardProps = {
  dateFilter: string;
  searchFilter: string;
  onChangeDate: (value: string) => void;
  onChangeSearch: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
};

export default function RegistroDetalheFiltersCard({
  dateFilter,
  searchFilter,
  onChangeDate,
  onChangeSearch,
  onApplyFilters,
  onClearFilters,
}: RegistroDetalheFiltersCardProps) {
  return (
    <Card className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Input id="filtro-data-detalhe" type="date" label="Data" value={dateFilter} onChange={(event) => onChangeDate(event.target.value)} />

        <div className="md:col-span-2">
          <Input
            id="filtro-busca-detalhe"
            type="search"
            label="Busca por placa ou nome"
            value={searchFilter}
            onChange={(event) => onChangeSearch(event.target.value)}
            placeholder="Ex.: ABC-1D23 ou João"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onApplyFilters}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="secondary" onClick={onClearFilters}>
          Limpar
        </Button>
      </div>
    </Card>
  );
}