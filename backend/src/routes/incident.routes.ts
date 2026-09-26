import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getIncidents,
  getIncident,
  postIncident,
  putIncident,
  postComment,
  getAgents,
} from '../controllers/incident.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getIncidents);
router.get('/agents', getAgents);
router.get('/:id', getIncident);
router.post('/', postIncident);
router.put('/:id', putIncident);
router.post('/:id/comments', postComment);

export default router;
