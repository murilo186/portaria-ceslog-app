import { createUsuarioController, deleteUsuarioController, listUsuariosController } from "../controllers/usuarioController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAdmin } from "../middlewares/roleMiddleware";
import { Router } from "express";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/usuarios", listUsuariosController);
router.post("/usuarios", createUsuarioController);
router.delete("/usuarios/:usuarioId", deleteUsuarioController);

export default router;
