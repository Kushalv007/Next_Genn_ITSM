import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getProblems,
  getProblem,
  postProblem,
  putProblem,
  postLinkIncident,
  postUnlinkIncident,
} from '../controllers/problem.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getProblems);
router.get('/:id', getProblem);
router.post('/', postProblem);
router.put('/:id', putProblem);
router.post('/:id/link-incident', postLinkIncident);
router.post('/:id/unlink-incident', postUnlinkIncident);
router.post('/:id/incidents', postLinkIncident);
router.delete('/:id/incidents', postUnlinkIncident);

export default router;
