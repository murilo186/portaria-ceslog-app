import { Router } from 'express';

const router = Router();

router.get('/hoje', (_req, res) => {
  return res.json({
    message: 'Relatório do dia OK'
  });
});

export default router;