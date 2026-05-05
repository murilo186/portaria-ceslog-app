import { env } from "../config/env";
import { getMssqlPool } from "../lib/mssql";
import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

const usuarioResumoSelect = {
  id: true,
  nome: true,
  usuario: true,
  email: true,
  perfil: true,
  turno: true,
} as const;

const relatorioItensInclude = {
  include: {
    usuario: {
      select: usuarioResumoSelect,
    },
  },
  orderBy: {
    id: "desc" as const,
  },
} as const;

const relatorioWithItensInclude = {
  itens: relatorioItensInclude,
} as const;

const relatorioSummarySelect = {
  id: true,
  dataRelatorio: true,
  status: true,
  criadoEm: true,
  finalizadoEm: true,
  _count: {
    select: {
      itens: true,
    },
  },
} as const;

const relatorioBaseSelect = {
  id: true,
  dataRelatorio: true,
  status: true,
  criadoEm: true,
  finalizadoEm: true,
} as const;

const managedItemInclude = {
  relatorio: true,
  usuario: {
    select: usuarioResumoSelect,
  },
} as const;

export type UsuarioResumo = Prisma.UsuarioGetPayload<{
  select: typeof usuarioResumoSelect;
}>;

export type RelatorioComItens = Prisma.RelatorioGetPayload<{
  include: typeof relatorioWithItensInclude;
}>;

export type RelatorioResumo = Prisma.RelatorioGetPayload<{
  select: typeof relatorioSummarySelect;
}>;

export type RelatorioBase = Prisma.RelatorioGetPayload<{
  select: typeof relatorioBaseSelect;
}>;

export type RelatorioItemComUsuario = Prisma.RelatorioItemGetPayload<{
  include: typeof relatorioItensInclude.include;
}>;

export type RelatorioItemGerenciado = Prisma.RelatorioItemGetPayload<{
  include: typeof managedItemInclude;
}>;

export type RelatorioStatusMinimo = {
  id: number;
  status: string;
};

export type RelatorioCleanupCandidate = {
  id: number;
  dataRelatorio: Date;
};

type ReportCoreRow = {
  id: number;
  tenantId: number;
  dataRelatorio: Date;
  status: string;
  criadoEm: Date;
  finalizadoEm: Date | null;
};

type ReportItemRow = {
  id: number;
  tenantId: number;
  relatorioId: number;
  usuarioId: number;
  perfilPessoa: string;
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada: string | null;
  horaSaida: string | null;
  observacoes: string | null;
  turno: string | null;
  criadoEm: Date;
  usuario_nome: string;
  usuario_usuario: string | null;
  usuario_email: string | null;
  usuario_perfil: string;
  usuario_turno: string | null;
};

function mapItemWithUsuario(row: ReportItemRow) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    relatorioId: row.relatorioId,
    usuarioId: row.usuarioId,
    perfilPessoa: row.perfilPessoa,
    empresa: row.empresa,
    placaVeiculo: row.placaVeiculo,
    nome: row.nome,
    horaEntrada: row.horaEntrada,
    horaSaida: row.horaSaida,
    observacoes: row.observacoes,
    turno: row.turno,
    criadoEm: row.criadoEm,
    usuario: {
      id: row.usuarioId,
      nome: row.usuario_nome,
      usuario: row.usuario_usuario,
      email: row.usuario_email,
      perfil: row.usuario_perfil,
      turno: row.usuario_turno,
    },
  };
}

async function listItemsByReport(tenantId: number, relatorioId: number): Promise<RelatorioItemComUsuario[]> {
  const pool = await getMssqlPool();
  const result = await pool.request().input("tenantId", tenantId).input("relatorioId", relatorioId).query<ReportItemRow>(`
      SELECT
        i.id, i.tenantId, i.relatorioId, i.usuarioId, i.perfilPessoa, i.empresa, i.placaVeiculo, i.nome,
        i.horaEntrada, i.horaSaida, i.observacoes, i.turno, i.criadoEm,
        u.nome AS usuario_nome, u.usuario AS usuario_usuario, u.email AS usuario_email, u.perfil AS usuario_perfil, u.turno AS usuario_turno
      FROM portaria.portaria_relatorio_itens i
      INNER JOIN portaria.portaria_usuarios u ON u.id = i.usuarioId
      WHERE i.tenantId = @tenantId
        AND i.relatorioId = @relatorioId
      ORDER BY i.id DESC
    `);

  return result.recordset.map((row) => mapItemWithUsuario(row)) as unknown as RelatorioItemComUsuario[];
}

function mapReportWithItems(core: ReportCoreRow, itens: RelatorioItemComUsuario[]): RelatorioComItens {
  return {
    ...core,
    itens,
  } as unknown as RelatorioComItens;
}

function extractClosedWhereFilters(where: Prisma.RelatorioWhereInput): {
  dateGte?: Date;
  dateLt?: Date;
  search?: string;
} {
  const filters: { dateGte?: Date; dateLt?: Date; search?: string } = {};

  if (where.dataRelatorio && typeof where.dataRelatorio === "object" && "gte" in where.dataRelatorio) {
    const gte = (where.dataRelatorio as { gte?: Date }).gte;
    const lt = (where.dataRelatorio as { lt?: Date }).lt;
    if (gte instanceof Date) {
      filters.dateGte = gte;
    }
    if (lt instanceof Date) {
      filters.dateLt = lt;
    }
  }

  const itens = where.itens as
    | {
        some?: {
          OR?: Array<{
            placaVeiculo?: { contains?: string };
            nome?: { contains?: string };
          }>;
        };
      }
    | undefined;
  const searchCandidate = itens?.some?.OR?.find((entry) => entry?.placaVeiculo?.contains || entry?.nome?.contains);
  filters.search = searchCandidate?.placaVeiculo?.contains ?? searchCandidate?.nome?.contains;

  return filters;
}

async function findReportCoreById(tenantId: number, relatorioId: number): Promise<ReportCoreRow | null> {
  const pool = await getMssqlPool();
  const result = await pool.request().input("tenantId", tenantId).input("relatorioId", relatorioId).query<ReportCoreRow>(`
      SELECT TOP 1 id, tenantId, dataRelatorio, status, criadoEm, finalizadoEm
      FROM portaria.portaria_relatorios
      WHERE tenantId = @tenantId
        AND id = @relatorioId
    `);

  return result.recordset[0] ?? null;
}

export interface IRelatorioRepository {
  findOpenReportsForCleanup(): Promise<RelatorioCleanupCandidate[]>;
  closeReportsByIds(reportIds: number[], finalizadoEm: Date): Promise<void>;
  findOpenReportWithItems(tenantId: number): Promise<RelatorioComItens | null>;
  findReportByBusinessDateWithItems(tenantId: number, dataRelatorio: Date): Promise<RelatorioComItens | null>;
  createOpenReportWithItems(tenantId: number, dataRelatorio: Date): Promise<RelatorioComItens>;
  listReportSummaries(tenantId: number): Promise<RelatorioResumo[]>;
  countClosedReports(tenantId: number, where: Prisma.RelatorioWhereInput): Promise<number>;
  listClosedReports(
    tenantId: number,
    where: Prisma.RelatorioWhereInput,
    page: number,
    pageSize: number,
  ): Promise<RelatorioResumo[]>;
  findReportByIdWithItems(tenantId: number, relatorioId: number): Promise<RelatorioComItens | null>;
  findReportByIdWithoutItems(tenantId: number, relatorioId: number): Promise<RelatorioBase | null>;
  listReportItemsByCursor(
    tenantId: number,
    relatorioId: number,
    itemCursor: number | undefined,
    itemLimit: number,
  ): Promise<RelatorioItemComUsuario[]>;
  findReportById(tenantId: number, relatorioId: number): Promise<Prisma.RelatorioGetPayload<object> | null>;
  findReportStatusById(tenantId: number, relatorioId: number): Promise<RelatorioStatusMinimo | null>;
  createRelatorioItem(data: Prisma.RelatorioItemUncheckedCreateInput): Promise<Prisma.RelatorioItemGetPayload<object>>;
  findManagedItem(tenantId: number, itemId: number): Promise<RelatorioItemGerenciado | null>;
  updateRelatorioItem(itemId: number, data: Prisma.RelatorioItemUncheckedUpdateInput): Promise<Prisma.RelatorioItemGetPayload<object>>;
  deleteRelatorioItemById(itemId: number): Promise<void>;
  updateRelatorioAsClosed(tenantId: number, relatorioId: number, finalizadoEm: Date): Promise<Prisma.RelatorioGetPayload<object>>;
}

export const relatorioRepository: IRelatorioRepository = {
  async findOpenReportsForCleanup() {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool.request().query<RelatorioCleanupCandidate>(`
          SELECT id, dataRelatorio
          FROM portaria.portaria_relatorios
          WHERE status = 'ABERTO'
        `);
      return result.recordset;
    }

    return prisma.relatorio.findMany({
      where: { status: "ABERTO" },
      select: {
        id: true,
        dataRelatorio: true,
      },
    });
  },

  async closeReportsByIds(reportIds: number[], finalizadoEm: Date) {
    if (reportIds.length === 0) {
      return;
    }

    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const request = pool.request().input("finalizadoEm", finalizadoEm);
      const placeholders = reportIds.map((id, index) => {
        const key = `id${index}`;
        request.input(key, id);
        return `@${key}`;
      });

      await request.query(`
        UPDATE portaria.portaria_relatorios
        SET status = 'FECHADO',
            finalizadoEm = @finalizadoEm
        WHERE id IN (${placeholders.join(", ")})
      `);
      return;
    }

    await prisma.relatorio.updateMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      data: {
        status: "FECHADO",
        finalizadoEm,
      },
    });
  },

  async findOpenReportWithItems(tenantId: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const reportResult = await pool.request().input("tenantId", tenantId).query<ReportCoreRow>(`
          SELECT TOP 1 id, tenantId, dataRelatorio, status, criadoEm, finalizadoEm
          FROM portaria.portaria_relatorios
          WHERE tenantId = @tenantId
            AND status = 'ABERTO'
          ORDER BY criadoEm DESC
        `);
      const report = reportResult.recordset[0];
      if (!report) {
        return null;
      }
      const itens = await listItemsByReport(tenantId, report.id);
      return mapReportWithItems(report, itens);
    }

    return prisma.relatorio.findFirst({
      where: {
        tenantId,
        status: "ABERTO",
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: relatorioWithItensInclude,
    });
  },

  async findReportByBusinessDateWithItems(tenantId: number, dataRelatorio: Date) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const reportResult = await pool.request().input("tenantId", tenantId).input("dataRelatorio", dataRelatorio).query<ReportCoreRow>(`
          SELECT TOP 1 id, tenantId, dataRelatorio, status, criadoEm, finalizadoEm
          FROM portaria.portaria_relatorios
          WHERE tenantId = @tenantId
            AND CONVERT(date, dataRelatorio) = CONVERT(date, @dataRelatorio)
          ORDER BY CASE WHEN status = 'ABERTO' THEN 0 ELSE 1 END, id DESC
        `);
      const report = reportResult.recordset[0];
      if (!report) {
        return null;
      }

      const itens = await listItemsByReport(tenantId, report.id);
      return mapReportWithItems(report, itens);
    }

    const startOfDay = new Date(dataRelatorio);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(startOfDay);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    return prisma.relatorio.findFirst({
      where: {
        tenantId,
        dataRelatorio: {
          gte: startOfDay,
          lt: nextDay,
        },
      },
      orderBy: [{ status: "asc" }, { id: "desc" }],
      include: relatorioWithItensInclude,
    });
  },

  async createOpenReportWithItems(tenantId: number, dataRelatorio: Date) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool.request().input("tenantId", tenantId).input("dataRelatorio", dataRelatorio).query<ReportCoreRow>(`
          INSERT INTO portaria.portaria_relatorios
          (tenantId, dataRelatorio, status, criadoEm, finalizadoEm)
          OUTPUT INSERTED.id, INSERTED.tenantId, INSERTED.dataRelatorio, INSERTED.status, INSERTED.criadoEm, INSERTED.finalizadoEm
          VALUES
          (@tenantId, @dataRelatorio, 'ABERTO', SYSUTCDATETIME(), NULL)
        `);
      const created = result.recordset[0];
      if (!created) {
        throw new Error("REPORT_CREATE_FAILED");
      }
      return mapReportWithItems(created, []);
    }

    return prisma.relatorio.create({
      data: {
        tenantId,
        dataRelatorio,
        status: "ABERTO",
      },
      include: relatorioWithItensInclude,
    });
  },

  async listReportSummaries(tenantId: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool.request().input("tenantId", tenantId).query<{
        id: number;
        dataRelatorio: Date;
        status: string;
        criadoEm: Date;
        finalizadoEm: Date | null;
        itensCount: number;
      }>(`
          SELECT
            r.id, r.dataRelatorio, r.status, r.criadoEm, r.finalizadoEm,
            (
              SELECT COUNT(1)
              FROM portaria.portaria_relatorio_itens i
              WHERE i.relatorioId = r.id
                AND i.tenantId = r.tenantId
            ) AS itensCount
          FROM portaria.portaria_relatorios r
          WHERE r.tenantId = @tenantId
          ORDER BY r.dataRelatorio DESC, r.id DESC
        `);

      return result.recordset.map((row) => ({
        id: row.id,
        dataRelatorio: row.dataRelatorio,
        status: row.status,
        criadoEm: row.criadoEm,
        finalizadoEm: row.finalizadoEm,
        _count: { itens: Number(row.itensCount ?? 0) },
      })) as unknown as RelatorioResumo[];
    }

    return prisma.relatorio.findMany({
      where: { tenantId },
      select: relatorioSummarySelect,
      orderBy: [{ dataRelatorio: "desc" }, { id: "desc" }],
    });
  },

  async countClosedReports(tenantId: number, where: Prisma.RelatorioWhereInput) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const filters = extractClosedWhereFilters(where);
      const request = pool.request().input("tenantId", tenantId);
      const clauses = ["r.tenantId = @tenantId", "r.status = 'FECHADO'"];

      if (filters.dateGte) {
        request.input("dateGte", filters.dateGte);
        clauses.push("r.dataRelatorio >= @dateGte");
      }

      if (filters.dateLt) {
        request.input("dateLt", filters.dateLt);
        clauses.push("r.dataRelatorio < @dateLt");
      }

      if (filters.search) {
        request.input("search", `%${filters.search}%`);
        clauses.push(`
          EXISTS (
            SELECT 1
            FROM portaria.portaria_relatorio_itens i
            WHERE i.relatorioId = r.id
              AND i.tenantId = r.tenantId
              AND (i.placaVeiculo LIKE @search OR i.nome LIKE @search)
          )
        `);
      }

      const result = await request.query<{ total: number }>(`
        SELECT COUNT(1) AS total
        FROM portaria.portaria_relatorios r
        WHERE ${clauses.join(" AND ")}
      `);
      return Number(result.recordset[0]?.total ?? 0);
    }

    return prisma.relatorio.count({
      where: {
        tenantId,
        ...where,
      },
    });
  },

  async listClosedReports(tenantId: number, where: Prisma.RelatorioWhereInput, page: number, pageSize: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const filters = extractClosedWhereFilters(where);
      const request = pool.request().input("tenantId", tenantId).input("offsetRows", (page - 1) * pageSize).input("fetchRows", pageSize);
      const clauses = ["r.tenantId = @tenantId", "r.status = 'FECHADO'"];

      if (filters.dateGte) {
        request.input("dateGte", filters.dateGte);
        clauses.push("r.dataRelatorio >= @dateGte");
      }

      if (filters.dateLt) {
        request.input("dateLt", filters.dateLt);
        clauses.push("r.dataRelatorio < @dateLt");
      }

      if (filters.search) {
        request.input("search", `%${filters.search}%`);
        clauses.push(`
          EXISTS (
            SELECT 1
            FROM portaria.portaria_relatorio_itens i
            WHERE i.relatorioId = r.id
              AND i.tenantId = r.tenantId
              AND (i.placaVeiculo LIKE @search OR i.nome LIKE @search)
          )
        `);
      }

      const result = await request.query<{
        id: number;
        dataRelatorio: Date;
        status: string;
        criadoEm: Date;
        finalizadoEm: Date | null;
        itensCount: number;
      }>(`
          SELECT
            r.id, r.dataRelatorio, r.status, r.criadoEm, r.finalizadoEm,
            (
              SELECT COUNT(1)
              FROM portaria.portaria_relatorio_itens i
              WHERE i.relatorioId = r.id
                AND i.tenantId = r.tenantId
            ) AS itensCount
          FROM portaria.portaria_relatorios r
          WHERE ${clauses.join(" AND ")}
          ORDER BY r.dataRelatorio DESC, r.id DESC
          OFFSET @offsetRows ROWS FETCH NEXT @fetchRows ROWS ONLY
        `);

      return result.recordset.map((row) => ({
        id: row.id,
        dataRelatorio: row.dataRelatorio,
        status: row.status,
        criadoEm: row.criadoEm,
        finalizadoEm: row.finalizadoEm,
        _count: { itens: Number(row.itensCount ?? 0) },
      })) as unknown as RelatorioResumo[];
    }

    return prisma.relatorio.findMany({
      where: {
        tenantId,
        ...where,
      },
      select: relatorioSummarySelect,
      orderBy: [{ dataRelatorio: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },

  async findReportByIdWithItems(tenantId: number, relatorioId: number) {
    if (env.DB_CLIENT === "mssql") {
      const report = await findReportCoreById(tenantId, relatorioId);
      if (!report) {
        return null;
      }
      const itens = await listItemsByReport(tenantId, relatorioId);
      return mapReportWithItems(report, itens);
    }

    return prisma.relatorio.findFirst({
      where: {
        tenantId,
        id: relatorioId,
      },
      include: relatorioWithItensInclude,
    });
  },

  async findReportByIdWithoutItems(tenantId: number, relatorioId: number) {
    if (env.DB_CLIENT === "mssql") {
      const report = await findReportCoreById(tenantId, relatorioId);
      return report as unknown as RelatorioBase | null;
    }

    return prisma.relatorio.findFirst({
      where: {
        tenantId,
        id: relatorioId,
      },
      select: relatorioBaseSelect,
    });
  },

  async listReportItemsByCursor(tenantId: number, relatorioId: number, itemCursor: number | undefined, itemLimit: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const request = pool.request().input("tenantId", tenantId).input("relatorioId", relatorioId).input("takeRows", itemLimit + 1);
      const cursorClause = itemCursor ? "AND i.id < @itemCursor" : "";
      if (itemCursor) {
        request.input("itemCursor", itemCursor);
      }

      const result = await request.query<ReportItemRow>(`
          SELECT TOP (@takeRows)
            i.id, i.tenantId, i.relatorioId, i.usuarioId, i.perfilPessoa, i.empresa, i.placaVeiculo, i.nome,
            i.horaEntrada, i.horaSaida, i.observacoes, i.turno, i.criadoEm,
            u.nome AS usuario_nome, u.usuario AS usuario_usuario, u.email AS usuario_email, u.perfil AS usuario_perfil, u.turno AS usuario_turno
          FROM portaria.portaria_relatorio_itens i
          INNER JOIN portaria.portaria_usuarios u ON u.id = i.usuarioId
          WHERE i.tenantId = @tenantId
            AND i.relatorioId = @relatorioId
            ${cursorClause}
          ORDER BY i.id DESC
        `);

      return result.recordset.map((row) => mapItemWithUsuario(row)) as unknown as RelatorioItemComUsuario[];
    }

    return prisma.relatorioItem.findMany({
      where: {
        tenantId,
        relatorioId,
        ...(itemCursor ? { id: { lt: itemCursor } } : {}),
      },
      orderBy: {
        id: "desc",
      },
      take: itemLimit + 1,
      include: relatorioItensInclude.include,
    });
  },

  async findReportById(tenantId: number, relatorioId: number) {
    if (env.DB_CLIENT === "mssql") {
      const report = await findReportCoreById(tenantId, relatorioId);
      return report as unknown as Prisma.RelatorioGetPayload<object> | null;
    }

    return prisma.relatorio.findFirst({
      where: {
        tenantId,
        id: relatorioId,
      },
    });
  },

  async findReportStatusById(tenantId: number, relatorioId: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool.request().input("tenantId", tenantId).input("relatorioId", relatorioId).query<RelatorioStatusMinimo>(`
          SELECT TOP 1 id, status
          FROM portaria.portaria_relatorios
          WHERE tenantId = @tenantId
            AND id = @relatorioId
        `);
      return result.recordset[0] ?? null;
    }

    return prisma.relatorio.findFirst({
      where: {
        tenantId,
        id: relatorioId,
      },
      select: {
        id: true,
        status: true,
      },
    });
  },

  async createRelatorioItem(data: Prisma.RelatorioItemUncheckedCreateInput) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool
        .request()
        .input("tenantId", Number(data.tenantId))
        .input("relatorioId", Number(data.relatorioId))
        .input("usuarioId", Number(data.usuarioId))
        .input("perfilPessoa", String(data.perfilPessoa))
        .input("empresa", String(data.empresa))
        .input("placaVeiculo", String(data.placaVeiculo))
        .input("nome", String(data.nome))
        .input("horaEntrada", data.horaEntrada ? String(data.horaEntrada) : null)
        .input("horaSaida", data.horaSaida ? String(data.horaSaida) : null)
        .input("observacoes", data.observacoes ? String(data.observacoes) : null)
        .input("turno", data.turno ? String(data.turno) : null)
        .query(`
          INSERT INTO portaria.portaria_relatorio_itens
          (
            tenantId, relatorioId, usuarioId, perfilPessoa, empresa, placaVeiculo, nome,
            horaEntrada, horaSaida, observacoes, turno, criadoEm
          )
          OUTPUT INSERTED.*
          VALUES
          (
            @tenantId, @relatorioId, @usuarioId, @perfilPessoa, @empresa, @placaVeiculo, @nome,
            @horaEntrada, @horaSaida, @observacoes, @turno, SYSUTCDATETIME()
          )
        `);
      return result.recordset[0] as unknown as Prisma.RelatorioItemGetPayload<object>;
    }

    return prisma.relatorioItem.create({
      data,
    });
  },

  async findManagedItem(tenantId: number, itemId: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool.request().input("tenantId", tenantId).input("itemId", itemId).query<{
        id: number;
        tenantId: number;
        relatorioId: number;
        usuarioId: number;
        perfilPessoa: string;
        empresa: string;
        placaVeiculo: string;
        nome: string;
        horaEntrada: string | null;
        horaSaida: string | null;
        observacoes: string | null;
        turno: string | null;
        criadoEm: Date;
        relatorio_status: string;
        usuario_nome: string;
        usuario_usuario: string | null;
        usuario_email: string | null;
        usuario_perfil: string;
        usuario_turno: string | null;
      }>(`
          SELECT TOP 1
            i.*,
            r.status AS relatorio_status,
            u.nome AS usuario_nome, u.usuario AS usuario_usuario, u.email AS usuario_email, u.perfil AS usuario_perfil, u.turno AS usuario_turno
          FROM portaria.portaria_relatorio_itens i
          INNER JOIN portaria.portaria_relatorios r ON r.id = i.relatorioId
          INNER JOIN portaria.portaria_usuarios u ON u.id = i.usuarioId
          WHERE i.tenantId = @tenantId
            AND i.id = @itemId
        `);
      const row = result.recordset[0];
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        tenantId: row.tenantId,
        relatorioId: row.relatorioId,
        usuarioId: row.usuarioId,
        perfilPessoa: row.perfilPessoa,
        empresa: row.empresa,
        placaVeiculo: row.placaVeiculo,
        nome: row.nome,
        horaEntrada: row.horaEntrada,
        horaSaida: row.horaSaida,
        observacoes: row.observacoes,
        turno: row.turno,
        criadoEm: row.criadoEm,
        relatorio: {
          id: row.relatorioId,
          status: row.relatorio_status,
        },
        usuario: {
          id: row.usuarioId,
          nome: row.usuario_nome,
          usuario: row.usuario_usuario,
          email: row.usuario_email,
          perfil: row.usuario_perfil,
          turno: row.usuario_turno,
        },
      } as unknown as RelatorioItemGerenciado;
    }

    return prisma.relatorioItem.findFirst({
      where: {
        tenantId,
        id: itemId,
      },
      include: managedItemInclude,
    });
  },

  async updateRelatorioItem(itemId: number, data: Prisma.RelatorioItemUncheckedUpdateInput) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool
        .request()
        .input("itemId", itemId)
        .input("perfilPessoa", data.perfilPessoa ? String(data.perfilPessoa) : null)
        .input("empresa", data.empresa ? String(data.empresa) : null)
        .input("placaVeiculo", data.placaVeiculo ? String(data.placaVeiculo) : null)
        .input("nome", data.nome ? String(data.nome) : null)
        .input("horaEntrada", data.horaEntrada ? String(data.horaEntrada) : null)
        .input("horaSaida", data.horaSaida ? String(data.horaSaida) : null)
        .input("observacoes", data.observacoes ? String(data.observacoes) : null)
        .query(`
          UPDATE portaria.portaria_relatorio_itens
          SET
            perfilPessoa = COALESCE(@perfilPessoa, perfilPessoa),
            empresa = COALESCE(@empresa, empresa),
            placaVeiculo = COALESCE(@placaVeiculo, placaVeiculo),
            nome = COALESCE(@nome, nome),
            horaEntrada = @horaEntrada,
            horaSaida = @horaSaida,
            observacoes = @observacoes
          OUTPUT INSERTED.*
          WHERE id = @itemId
        `);
      return result.recordset[0] as unknown as Prisma.RelatorioItemGetPayload<object>;
    }

    return prisma.relatorioItem.update({
      where: { id: itemId },
      data,
    });
  },

  async deleteRelatorioItemById(itemId: number) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      await pool.request().input("itemId", itemId).query(`
          DELETE FROM portaria.portaria_relatorio_itens
          WHERE id = @itemId
        `);
      return;
    }

    await prisma.relatorioItem.delete({
      where: { id: itemId },
    });
  },

  async updateRelatorioAsClosed(tenantId: number, relatorioId: number, finalizadoEm: Date) {
    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      const result = await pool
        .request()
        .input("tenantId", tenantId)
        .input("relatorioId", relatorioId)
        .input("finalizadoEm", finalizadoEm)
        .query<ReportCoreRow>(`
          UPDATE portaria.portaria_relatorios
          SET status = 'FECHADO',
              finalizadoEm = @finalizadoEm
          OUTPUT INSERTED.id, INSERTED.tenantId, INSERTED.dataRelatorio, INSERTED.status, INSERTED.criadoEm, INSERTED.finalizadoEm
          WHERE tenantId = @tenantId
            AND id = @relatorioId
        `);

      const row = result.recordset[0];
      if (!row) {
        throw new Error("REPORT_NOT_FOUND_OR_NOT_OWNED");
      }

      return row as unknown as Prisma.RelatorioGetPayload<object>;
    }

    const closed = await prisma.relatorio.updateMany({
      where: {
        tenantId,
        id: relatorioId,
      },
      data: {
        status: "FECHADO",
        finalizadoEm,
      },
    });

    if (closed.count === 0) {
      throw new Error("REPORT_NOT_FOUND_OR_NOT_OWNED");
    }

    return prisma.relatorio.findFirstOrThrow({
      where: {
        tenantId,
        id: relatorioId,
      },
    });
  },
};

export const findOpenReportsForCleanup = (...args: Parameters<IRelatorioRepository["findOpenReportsForCleanup"]>) =>
  relatorioRepository.findOpenReportsForCleanup(...args);
export const closeReportsByIds = (...args: Parameters<IRelatorioRepository["closeReportsByIds"]>) =>
  relatorioRepository.closeReportsByIds(...args);
export const findOpenReportWithItems = (...args: Parameters<IRelatorioRepository["findOpenReportWithItems"]>) =>
  relatorioRepository.findOpenReportWithItems(...args);
export const findReportByBusinessDateWithItems = (
  ...args: Parameters<IRelatorioRepository["findReportByBusinessDateWithItems"]>
) => relatorioRepository.findReportByBusinessDateWithItems(...args);
export const createOpenReportWithItems = (...args: Parameters<IRelatorioRepository["createOpenReportWithItems"]>) =>
  relatorioRepository.createOpenReportWithItems(...args);
export const listReportSummaries = (...args: Parameters<IRelatorioRepository["listReportSummaries"]>) =>
  relatorioRepository.listReportSummaries(...args);
export const countClosedReports = (...args: Parameters<IRelatorioRepository["countClosedReports"]>) =>
  relatorioRepository.countClosedReports(...args);
export const listClosedReports = (...args: Parameters<IRelatorioRepository["listClosedReports"]>) =>
  relatorioRepository.listClosedReports(...args);
export const findReportByIdWithItems = (...args: Parameters<IRelatorioRepository["findReportByIdWithItems"]>) =>
  relatorioRepository.findReportByIdWithItems(...args);
export const findReportById = (...args: Parameters<IRelatorioRepository["findReportById"]>) =>
  relatorioRepository.findReportById(...args);
export const findReportStatusById = (...args: Parameters<IRelatorioRepository["findReportStatusById"]>) =>
  relatorioRepository.findReportStatusById(...args);
export const createRelatorioItem = (...args: Parameters<IRelatorioRepository["createRelatorioItem"]>) =>
  relatorioRepository.createRelatorioItem(...args);
export const findManagedItem = (...args: Parameters<IRelatorioRepository["findManagedItem"]>) =>
  relatorioRepository.findManagedItem(...args);
export const updateRelatorioItem = (...args: Parameters<IRelatorioRepository["updateRelatorioItem"]>) =>
  relatorioRepository.updateRelatorioItem(...args);
export const deleteRelatorioItemById = (...args: Parameters<IRelatorioRepository["deleteRelatorioItemById"]>) =>
  relatorioRepository.deleteRelatorioItemById(...args);
export const updateRelatorioAsClosed = (...args: Parameters<IRelatorioRepository["updateRelatorioAsClosed"]>) =>
  relatorioRepository.updateRelatorioAsClosed(...args);
