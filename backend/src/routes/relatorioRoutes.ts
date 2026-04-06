import {
  closeRelatorioController,
  createRelatorioItemController,
  deleteRelatorioItemController,
  getReportByIdController,
  getTodayReportController,
  listReportsController,
  updateRelatorioItemController,
} from "../controllers/relatorioController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { writeRateLimit } from "../middlewares/rateLimitMiddleware";
import { Router } from "express";

const router = Router();

router.use(authMiddleware);

router.get("/hoje", getTodayReportController);
router.get("/", listReportsController);
router.get("/:relatorioId", getReportByIdController);

router.post("/:relatorioId/itens", writeRateLimit, createRelatorioItemController);
router.put("/:relatorioId/itens/:itemId", writeRateLimit, updateRelatorioItemController);
router.delete("/:relatorioId/itens/:itemId", writeRateLimit, deleteRelatorioItemController);
router.post("/:relatorioId/fechar", writeRateLimit, closeRelatorioController);

export default router;
