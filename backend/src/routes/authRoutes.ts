import { Router } from 'express';

const router = Router();

router.post('/login', (req, res) => {
  return res.json({
    message: 'Login route OK',
    body: req.body
  });
});

export default router;