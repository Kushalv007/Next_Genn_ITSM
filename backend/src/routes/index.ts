import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import incidentRoutes from './incident.routes';
import catalogRoutes from './catalog.routes';
import requestRoutes from './request.routes';
import knowledgeRoutes from './knowledge.routes';
import notificationRoutes from './notification.routes';
import problemRoutes from './problem.routes';
import changeRoutes from './change.routes';
import assetRoutes from './asset.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/service-catalog', catalogRoutes);
router.use('/requests', requestRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/problems', problemRoutes);
router.use('/changes', changeRoutes);
router.use('/assets', assetRoutes);

export default router;
