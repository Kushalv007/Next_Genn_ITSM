import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  listArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  suggestArticlesByKeywords,
} from '../services/knowledge.service';

export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  const { category, search, status } = req.query;
  const articles = await listArticles(
    {
      category: category as string,
      search: search as string,
      status: status as string,
    },
    req.user
  );

  res.status(200).json({
    success: true,
    data: articles,
  });
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await getArticleById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: article,
  });
});

export const postArticle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const created = await createArticle(req.body, req.user.userId, req.user);

  res.status(201).json({
    success: true,
    data: created,
    message: 'Knowledge article created successfully',
  });
});

export const putArticle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await updateArticle(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Knowledge article updated successfully',
  });
});

export const removeArticle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const result = await deleteArticle(req.params.id, req.user);

  res.status(200).json(result);
});

export const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  const articles = await suggestArticlesByKeywords((query as string) || '');

  res.status(200).json({
    success: true,
    data: articles,
  });
});

