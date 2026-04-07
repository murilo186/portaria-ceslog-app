-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "usuario" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");
