-- CreateEnum
CREATE TYPE "PerfilPessoa" AS ENUM ('VISITANTE', 'FORNECEDOR', 'PRESTADOR', 'PARCEIRO', 'COLABORADOR', 'AGREGADO');

-- AlterTable
ALTER TABLE "relatorio_itens" ADD COLUMN     "perfilPessoa" "PerfilPessoa" NOT NULL DEFAULT 'VISITANTE';
