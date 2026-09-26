import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getChanges,
  getChange,
  postChange,
  putChange,
  postChangeApproval,
  patchChangeStatus,
} from '../controllers/change.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getChanges);
router.get('/:id', getChange);
router.post('/', postChange);
router.put('/:id', putChange);
router.post('/:id/approval', postChangeApproval);
router.patch('/:id/status', patchChangeStatus);

export default router;
