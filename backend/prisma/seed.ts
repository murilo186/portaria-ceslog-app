import { PerfilUsuario, PrismaClient, TurnoUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUsuario = {
  nome: string;
  usuario: string;
  email: string;
  turno: TurnoUsuario | null;
  perfil: PerfilUsuario;
  senha: string;
};

async function upsertUsuario(usuario: SeedUsuario) {
  const senhaHash = await bcrypt.hash(usuario.senha, 10);

  await prisma.usuario.upsert({
    where: { usuario: usuario.usuario },
    update: {
      nome: usuario.nome,
      usuario: usuario.usuario,
      email: usuario.email,
      perfil: usuario.perfil,
      turno: usuario.turno,
      ativo: true,
      senhaHash,
    },
    create: {
      nome: usuario.nome,
      usuario: usuario.usuario,
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
      usuario: "operador.manha",
      email: "operador.manha@usuario.local",
      turno: "MANHA",
      perfil: PerfilUsuario.OPERADOR,
      senha: "Operador@123",
    },
    {
      nome: "Operador Noite",
      usuario: "operador.noite",
      email: "operador.noite@usuario.local",
      turno: "TARDE",
      perfil: PerfilUsuario.OPERADOR,
      senha: "Operador@123",
    },
    {
      nome: "Admin Ceslog",
      usuario: "admin",
      email: "admin@usuario.local",
      turno: null,
      perfil: PerfilUsuario.ADMIN,
      senha: "Admin@123",
    },
  ];

  for (const usuario of usuarios) {
    await upsertUsuario(usuario);
  }

  console.log("Seed concluido. Usuarios de teste atualizados/criados.");
  console.log("Usuario: operador.manha | Senha: Operador@123 | Perfil: OPERADOR");
  console.log("Usuario: operador.noite | Senha: Operador@123 | Perfil: OPERADOR");
  console.log("Usuario: admin | Senha: Admin@123 | Perfil: ADMIN");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

