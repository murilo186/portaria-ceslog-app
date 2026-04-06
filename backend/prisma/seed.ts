import { PerfilUsuario, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUsuario = {
  nome: string;
  email: string;
  turno: string | null;
  perfil: PerfilUsuario;
  senha: string;
};

async function upsertUsuario(usuario: SeedUsuario) {
  const senhaHash = await bcrypt.hash(usuario.senha, 10);

  await prisma.usuario.upsert({
    where: { email: usuario.email },
    update: {
      nome: usuario.nome,
      perfil: usuario.perfil,
      turno: usuario.turno,
      ativo: true,
      senhaHash,
    },
    create: {
      nome: usuario.nome,
      email: usuario.email,
      senhaHash,
      perfil: usuario.perfil,
      turno: usuario.turno,
      ativo: true,
    },
  });
}

async function main() {
  const usuarios: SeedUsuario[] = [
    {
      nome: "Operador Manha",
      email: "operador.manha@ceslog.local",
      turno: "MANHA",
      perfil: PerfilUsuario.OPERADOR,
      senha: "Operador@123",
    },
    {
      nome: "Operador Noite",
      email: "operador.noite@ceslog.local",
      turno: "NOITE",
      perfil: PerfilUsuario.OPERADOR,
      senha: "Operador@123",
    },
    {
      nome: "Admin Ceslog",
      email: "admin@ceslog.local",
      turno: null,
      perfil: PerfilUsuario.ADMIN,
      senha: "Admin@123",
    },
  ];

  for (const usuario of usuarios) {
    await upsertUsuario(usuario);
  }

  console.log("Seed concluido. Usuarios de teste atualizados/criados.");
  console.log("Email: operador.manha@ceslog.local | Senha: Operador@123 | Perfil: OPERADOR");
  console.log("Email: operador.noite@ceslog.local | Senha: Operador@123 | Perfil: OPERADOR");
  console.log("Email: admin@ceslog.local | Senha: Admin@123 | Perfil: ADMIN");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

