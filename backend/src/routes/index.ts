import { Router } from 'express';
import authRoutes from './authRoutes';
import relatorioRoutes from './relatorioRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/relatorios', relatorioRoutes);

export default router;