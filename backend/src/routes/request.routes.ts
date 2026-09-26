import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  postRequest,
  getRequests,
  getRequest,
  putRequest,
  postApproval,
} from '../controllers/catalog.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getRequests);
router.get('/:id', getRequest);
router.post('/', postRequest);
router.put('/:id', putRequest);
router.post('/:id/approval', postApproval);

export default router;
