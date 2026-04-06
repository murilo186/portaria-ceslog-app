-- CreateEnum
CREATE TYPE "TurnoUsuario" AS ENUM ('MANHA', 'TARDE');

-- AlterTable (safe migration from free-text to enum)
ALTER TABLE "usuarios" ADD COLUMN "turno_novo" "TurnoUsuario";

UPDATE "usuarios"
SET "turno_novo" = CASE
  WHEN UPPER(COALESCE("turno", '')) = 'MANHA' THEN 'MANHA'::"TurnoUsuario"
  WHEN UPPER(COALESCE("turno", '')) = 'NOITE' THEN 'TARDE'::"TurnoUsuario"
  WHEN UPPER(COALESCE("turno", '')) = 'TARDE' THEN 'TARDE'::"TurnoUsuario"
  ELSE NULL
END;

ALTER TABLE "usuarios" DROP COLUMN "turno";
ALTER TABLE "usuarios" RENAME COLUMN "turno_novo" TO "turno";
