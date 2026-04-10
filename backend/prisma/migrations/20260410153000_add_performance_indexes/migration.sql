CREATE INDEX "relatorios_status_dataRelatorio_idx" ON "relatorios"("status", "dataRelatorio");

CREATE INDEX "relatorio_itens_relatorioId_criadoEm_idx" ON "relatorio_itens"("relatorioId", "criadoEm");
CREATE INDEX "relatorio_itens_usuarioId_criadoEm_idx" ON "relatorio_itens"("usuarioId", "criadoEm");
CREATE INDEX "relatorio_itens_placaVeiculo_idx" ON "relatorio_itens"("placaVeiculo");
CREATE INDEX "relatorio_itens_nome_idx" ON "relatorio_itens"("nome");