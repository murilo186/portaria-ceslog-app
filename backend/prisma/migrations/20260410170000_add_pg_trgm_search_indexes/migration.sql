CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "relatorio_itens_nome_trgm_idx"
  ON "relatorio_itens" USING GIN ("nome" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "relatorio_itens_placaVeiculo_trgm_idx"
  ON "relatorio_itens" USING GIN ("placaVeiculo" gin_trgm_ops);