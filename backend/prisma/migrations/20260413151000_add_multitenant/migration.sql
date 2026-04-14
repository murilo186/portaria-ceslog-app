CREATE TABLE IF NOT EXISTS "tenants" (
  "id" SERIAL NOT NULL,
  "slug" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenants_slug_key" UNIQUE ("slug")
);

INSERT INTO "tenants" ("slug", "nome", "ativo")
VALUES
  ('ceslog', 'CESLOG', true),
  ('ucc', 'UCC', true)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "relatorio_itens" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

UPDATE "usuarios"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'ceslog' LIMIT 1)
WHERE "tenantId" IS NULL;

UPDATE "relatorios"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'ceslog' LIMIT 1)
WHERE "tenantId" IS NULL;

UPDATE "relatorio_itens"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'ceslog' LIMIT 1)
WHERE "tenantId" IS NULL;

UPDATE "audit_logs"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'ceslog' LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "usuarios" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "relatorios" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "relatorio_itens" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_tenantId_fkey') THEN
    ALTER TABLE "usuarios"
      ADD CONSTRAINT "usuarios_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relatorios_tenantId_fkey') THEN
    ALTER TABLE "relatorios"
      ADD CONSTRAINT "relatorios_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relatorio_itens_tenantId_fkey') THEN
    ALTER TABLE "relatorio_itens"
      ADD CONSTRAINT "relatorio_itens_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_tenantId_fkey') THEN
    ALTER TABLE "audit_logs"
      ADD CONSTRAINT "audit_logs_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "relatorios" DROP CONSTRAINT IF EXISTS "relatorios_dataRelatorio_key";
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_tenantId_dataRelatorio_key" UNIQUE ("tenantId", "dataRelatorio");

DROP INDEX IF EXISTS "relatorios_status_dataRelatorio_idx";
CREATE INDEX IF NOT EXISTS "relatorios_tenantId_status_dataRelatorio_idx" ON "relatorios"("tenantId", "status", "dataRelatorio");

CREATE INDEX IF NOT EXISTS "usuarios_tenantId_perfil_ativo_idx" ON "usuarios"("tenantId", "perfil", "ativo");

DROP INDEX IF EXISTS "relatorio_itens_relatorioId_idx";
DROP INDEX IF EXISTS "relatorio_itens_usuarioId_idx";
DROP INDEX IF EXISTS "relatorio_itens_relatorioId_criadoEm_idx";
DROP INDEX IF EXISTS "relatorio_itens_usuarioId_criadoEm_idx";
DROP INDEX IF EXISTS "relatorio_itens_placaVeiculo_idx";
DROP INDEX IF EXISTS "relatorio_itens_nome_idx";

CREATE INDEX IF NOT EXISTS "relatorio_itens_tenantId_relatorioId_idx" ON "relatorio_itens"("tenantId", "relatorioId");
CREATE INDEX IF NOT EXISTS "relatorio_itens_tenantId_usuarioId_idx" ON "relatorio_itens"("tenantId", "usuarioId");
CREATE INDEX IF NOT EXISTS "relatorio_itens_tenantId_relatorioId_criadoEm_idx" ON "relatorio_itens"("tenantId", "relatorioId", "criadoEm");
CREATE INDEX IF NOT EXISTS "relatorio_itens_tenantId_usuarioId_criadoEm_idx" ON "relatorio_itens"("tenantId", "usuarioId", "criadoEm");
CREATE INDEX IF NOT EXISTS "relatorio_itens_tenantId_placaVeiculo_idx" ON "relatorio_itens"("tenantId", "placaVeiculo");
CREATE INDEX IF NOT EXISTS "relatorio_itens_tenantId_nome_idx" ON "relatorio_itens"("tenantId", "nome");

DROP INDEX IF EXISTS "audit_logs_usuario_id_idx";
DROP INDEX IF EXISTS "audit_logs_criado_em_idx";
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_usuario_id_idx" ON "audit_logs"("tenantId", "usuario_id");
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_criado_em_idx" ON "audit_logs"("tenantId", "criado_em");