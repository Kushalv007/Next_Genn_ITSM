import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getCatalogItems, getCatalogItem } from '../controllers/catalog.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getCatalogItems);
router.get('/:id', getCatalogItem);

export default router;
