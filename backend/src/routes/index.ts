import authRoutes from "./authRoutes";
import relatorioRoutes from "./relatorioRoutes";
import { Router } from "express";

const router = Router();

router.use("/auth", authRoutes);
router.use("/relatorios", relatorioRoutes);

export default router;
