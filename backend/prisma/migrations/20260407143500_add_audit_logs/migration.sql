CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "usuario_nome" TEXT,
    "usuario_login" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" INTEGER,
    "descricao" TEXT NOT NULL,
    "detalhes" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_usuario_id_idx" ON "audit_logs"("usuario_id");
CREATE INDEX "audit_logs_criado_em_idx" ON "audit_logs"("criado_em");

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
