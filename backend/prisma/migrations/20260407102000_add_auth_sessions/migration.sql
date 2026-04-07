CREATE TABLE "auth_sessions" (
  "usuario_id" INTEGER NOT NULL,
  "session_id" TEXT NOT NULL,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("usuario_id"),
  CONSTRAINT "auth_sessions_usuario_id_fkey"
    FOREIGN KEY ("usuario_id")
    REFERENCES "usuarios"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "auth_sessions_session_id_key" ON "auth_sessions"("session_id");
