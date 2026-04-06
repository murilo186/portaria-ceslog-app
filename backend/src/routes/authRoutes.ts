import { loginController } from "../controllers/authController";
import { loginRateLimit } from "../middlewares/rateLimitMiddleware";
import { Router } from "express";

const router = Router();

router.post("/login", loginRateLimit, loginController);

export default router;
