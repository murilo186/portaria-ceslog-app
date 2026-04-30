import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegistroDetalheHeader from "../../src/pages/Registros/components/RegistroDetalheHeader";

describe("RegistroDetalheHeader", () => {
  it("mostra aviso de permissão para não-admin", () => {
    render(
      <RegistroDetalheHeader
        status="FECHADO"
        dataRelatorio="2026-04-29T00:00:00.000Z"
        isLoading={false}
        canDownloadCsv={true}
        isAdmin={false}
        appliedSearchFilter=""
        totalOccurrences={0}
        matchedItems={0}
        errorMessage={null}
        onDownloadCsv={() => undefined}
      />,
    );

    expect(screen.getByText("Somente administradores podem editar registros fechados.")).toBeInTheDocument();
  });

  it("não mostra aviso de permissão para admin", () => {
    const { queryByText } = render(
      <RegistroDetalheHeader
        status="FECHADO"
        dataRelatorio="2026-04-29T00:00:00.000Z"
        isLoading={false}
        canDownloadCsv={true}
        isAdmin={true}
        appliedSearchFilter=""
        totalOccurrences={0}
        matchedItems={0}
        errorMessage={null}
        onDownloadCsv={() => undefined}
      />,
    );

    expect(queryByText("Somente administradores podem editar registros fechados.")).not.toBeInTheDocument();
  });
});
