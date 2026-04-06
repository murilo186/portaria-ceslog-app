import { checkHealthService } from "../services/healthService";
import type { Request, Response } from "express";

export async function healthController(req: Request, res: Response) {
  try {
    const health = await checkHealthService();

    return res.status(200).json(health);
  } catch (error) {
    console.error("health_check_failed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(503).json({
      ok: false,
      database: "down",
      timestamp: new Date().toISOString(),
      message: "Falha na conexão com o banco de dados",
    });
  }
}

