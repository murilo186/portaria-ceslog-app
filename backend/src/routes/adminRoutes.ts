import { listAuditLogsController } from "../controllers/auditController";
import {
  createUsuarioController,
  deleteUsuarioController,
  listUsuariosController,
  updateUsuarioSenhaController,
} from "../controllers/usuarioController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAdmin } from "../middlewares/roleMiddleware";
import { Router } from "express";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/logs", listAuditLogsController);
router.get("/usuarios", listUsuariosController);
router.post("/usuarios", createUsuarioController);
router.delete("/usuarios/:usuarioId", deleteUsuarioController);
router.patch("/usuarios/:usuarioId/senha", updateUsuarioSenhaController);

export default router;
