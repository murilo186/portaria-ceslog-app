import { listAuditLogsService } from "../services/auditService";
import { ensureAuthenticatedUser } from "./helpers/ensureAuthenticatedUser";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const listAuditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = ensureAuthenticatedUser(req);
    const { limit } = listAuditLogsQuerySchema.parse(req.query);
    const logs = await listAuditLogsService(limit, currentUser.tenantId);

    return res.status(200).json(logs);
  } catch (error) {
    return next(error);
  }
}
