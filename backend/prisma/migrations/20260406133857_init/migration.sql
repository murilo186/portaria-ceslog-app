-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusRelatorio" AS ENUM ('ABERTO', 'FECHADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "turno" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios" (
    "id" SERIAL NOT NULL,
    "dataRelatorio" TIMESTAMP(3) NOT NULL,
    "status" "StatusRelatorio" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorio_itens" (
    "id" SERIAL NOT NULL,
    "relatorioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "empresa" TEXT NOT NULL,
    "placaVeiculo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "horaEntrada" TEXT,
    "horaSaida" TEXT,
    "observacoes" TEXT,
    "turno" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorio_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_dataRelatorio_key" ON "relatorios"("dataRelatorio");

-- CreateIndex
CREATE INDEX "relatorio_itens_relatorioId_idx" ON "relatorio_itens"("relatorioId");

-- CreateIndex
CREATE INDEX "relatorio_itens_usuarioId_idx" ON "relatorio_itens"("usuarioId");

-- AddForeignKey
ALTER TABLE "relatorio_itens" ADD CONSTRAINT "relatorio_itens_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "relatorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio_itens" ADD CONSTRAINT "relatorio_itens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
