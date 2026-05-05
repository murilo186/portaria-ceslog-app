import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type PerfilUsuario = "ADMIN" | "OPERADOR";
type TurnoUsuario = "MANHA" | "TARDE";

type SeedUsuario = {
  tenantSlug: string;
  nome: string;
  usuario: string;
  email: string;
  turno: TurnoUsuario | null;
  perfil: PerfilUsuario;
  senha: string;
};

async function upsertTenant(slug: string, nome: string) {
  return prisma.tenant.upsert({
    where: { slug },
    update: { nome, ativo: true },
    create: { slug, nome, ativo: true },
  });
}

async function upsertUsuario(usuario: SeedUsuario) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: usuario.tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error(`Tenant nao encontrado para o slug ${usuario.tenantSlug}`);
  }

  const senhaHash = await bcrypt.hash(usuario.senha, 10);

  await prisma.usuario.upsert({
    where: { usuario: usuario.usuario },
    update: {
      tenantId: tenant.id,
      nome: usuario.nome,
      usuario: usuario.usuario,
      email: usuario.email,
      perfil: usuario.perfil,
      turno: usuario.turno,
      ativo: true,
      senhaHash,
    },
    create: {
      tenantId: tenant.id,
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
  await upsertTenant("CESLOG", "CESLOG");
  await upsertTenant("UCC", "UCC");

  const usuarios: SeedUsuario[] = [
    {
      tenantSlug: "CESLOG",
      nome: "ADMIN CESLOG",
      usuario: "ADMIN",
      email: "ADMIN@USUARIO.LOCAL",
      turno: null,
      perfil: "ADMIN",
      senha: "Admin@123",
    },
    {
      tenantSlug: "CESLOG",
      nome: "OPERADOR MANHA",
      usuario: "OPERADOR.MANHA",
      email: "OPERADOR.MANHA@USUARIO.LOCAL",
      turno: "MANHA",
      perfil: "OPERADOR",
      senha: "Operador@123",
    },
    {
      tenantSlug: "CESLOG",
      nome: "OPERADOR NOITE",
      usuario: "OPERADOR.NOITE",
      email: "OPERADOR.NOITE@USUARIO.LOCAL",
      turno: "TARDE",
      perfil: "OPERADOR",
      senha: "Operador@123",
    },
    {
      tenantSlug: "UCC",
      nome: "ADMIN UCC",
      usuario: "UCC.TESTE",
      email: "UCC.TESTE@USUARIO.LOCAL",
      turno: null,
      perfil: "ADMIN",
      senha: "123456",
    },
  ];

  for (const usuario of usuarios) {
    await upsertUsuario(usuario);
  }

  console.log("Seed concluido. Tenants e usuarios de teste atualizados/criados.");
  console.log("Tenant CESLOG:");
  console.log("  Usuario: admin | Senha: Admin@123 | Perfil: ADMIN");
  console.log("  Usuario: operador.manha | Senha: Operador@123 | Perfil: OPERADOR");
  console.log("  Usuario: operador.noite | Senha: Operador@123 | Perfil: OPERADOR");
  console.log("Tenant UCC:");
  console.log("  Usuario: ucc.teste | Senha: 123456 | Perfil: ADMIN");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

