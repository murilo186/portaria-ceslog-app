import { healthController } from "../controllers/healthController";
import { Router } from "express";

const router = Router();

router.get("/health", healthController);

export default router;

