import { PerfilUsuario, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaPadrao = "Operador@123";
  const senhaHash = await bcrypt.hash(senhaPadrao, 10);

  const usuarios = [
    {
      nome: "Operador Manha",
      email: "operador.manha@ceslog.local",
      turno: "MANHA",
    },
    {
      nome: "Operador Noite",
      email: "operador.noite@ceslog.local",
      turno: "NOITE",
    },
  ] as const;

  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {
        nome: usuario.nome,
        perfil: PerfilUsuario.OPERADOR,
        turno: usuario.turno,
        ativo: true,
      },
      create: {
        nome: usuario.nome,
        email: usuario.email,
        senhaHash,
        perfil: PerfilUsuario.OPERADOR,
        turno: usuario.turno,
        ativo: true,
      },
    });
  }

  console.log("Seed concluido. Usuarios de teste atualizados/criados.");
  console.log("Email: operador.manha@ceslog.local | Senha: Operador@123");
  console.log("Email: operador.noite@ceslog.local | Senha: Operador@123");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
