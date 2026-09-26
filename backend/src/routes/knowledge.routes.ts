import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getArticles,
  getArticle,
  postArticle,
  putArticle,
  removeArticle,
  getSuggestions,
} from '../controllers/knowledge.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getArticles);
router.get('/suggest', getSuggestions);
router.get('/:id', getArticle);
router.post('/', postArticle);
router.put('/:id', putArticle);
router.delete('/:id', removeArticle);

export default router;
