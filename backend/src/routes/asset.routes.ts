import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAssets,
  getAsset,
  postAsset,
  putAsset,
} from '../controllers/asset.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getAssets);
router.get('/:id', getAsset);
router.post('/', postAsset);
router.put('/:id', putAsset);

export default router;
