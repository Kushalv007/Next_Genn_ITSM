import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation';

const router = Router();

router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  register
);

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  login
);

router.post(
  '/refresh',
  validateRequest({ body: refreshSchema }),
  refreshToken
);

router.post('/logout', authMiddleware, logout);

router.get('/me', authMiddleware, getMe);

export default router;
