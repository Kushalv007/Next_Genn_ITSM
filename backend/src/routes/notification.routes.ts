import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  patchRead,
  postReadAll,
} from '../controllers/notification.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', patchRead);
router.post('/:id/read', patchRead);
router.patch('/read-all', postReadAll);
router.post('/read-all', postReadAll);

export default router;
