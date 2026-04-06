import {
  closeRelatorioController,
  createNewReportController,
  createRelatorioItemController,
  deleteRelatorioItemController,
  getOpenReportController,
  getReportByIdController,
  getTodayReportController,
  listClosedReportsController,
  listReportsController,
  updateRelatorioItemController,
} from "../controllers/relatorioController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { writeRateLimit } from "../middlewares/rateLimitMiddleware";
import { Router } from "express";

const router = Router();

router.use(authMiddleware);

router.get("/hoje", getTodayReportController);
router.get("/aberto", getOpenReportController);
router.get("/", listReportsController);
router.post("/novo", writeRateLimit, createNewReportController);
router.get("/fechados", listClosedReportsController);
router.get("/:relatorioId", getReportByIdController);

router.post("/:relatorioId/itens", writeRateLimit, createRelatorioItemController);
router.put("/:relatorioId/itens/:itemId", writeRateLimit, updateRelatorioItemController);
router.delete("/:relatorioId/itens/:itemId", writeRateLimit, deleteRelatorioItemController);
router.post("/:relatorioId/fechar", writeRateLimit, closeRelatorioController);

export default router;
