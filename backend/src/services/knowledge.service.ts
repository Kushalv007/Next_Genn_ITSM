import { Role, ArticleStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { mockStore, isDbConnectionError, MockKnowledgeArticle } from '../mock/mockStore';

export interface ArticleFilters {
  category?: string;
  search?: string;
  status?: string;
}

export interface CreateArticleInput {
  title: string;
  content: string;
  category: string;
  status?: ArticleStatus;
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  category?: string;
  status?: ArticleStatus;
}

export async function listArticles(
  filters: ArticleFilters = {},
  user?: { userId: string; role: Role }
) {
  const where: Prisma.KnowledgeArticleWhereInput = {};

  if (!user || user.role === Role.User) {
    where.status = ArticleStatus.PUBLISHED;
  } else if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status as ArticleStatus;
  }

  if (filters.category && filters.category !== 'ALL') {
    where.category = filters.category;
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { content: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
    ];
  }

  try {
    return await prisma.knowledgeArticle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      console.warn('⚠️ [ITSM Knowledge Service] DB unreachable. Using in-memory store.');
      let list = [...mockStore.knowledgeArticles];
      if (!user || user.role === Role.User) {
        list = list.filter((a) => a.status === ArticleStatus.PUBLISHED);
      } else if (filters.status && filters.status !== 'ALL') {
        list = list.filter((a) => a.status === filters.status);
      }
      if (filters.category && filters.category !== 'ALL') {
        list = list.filter((a) => a.category === filters.category);
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(s) ||
            a.content.toLowerCase().includes(s) ||
            a.category.toLowerCase().includes(s)
        );
      }
      return list.map((a) => mockStore.getKnowledgeWithRelations(a));
    }
    throw err;
  }
}

export async function getArticleById(id: string, user?: { userId: string; role: Role }) {
  try {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    if (!article) {
      throw new AppError('Knowledge article not found', 404);
    }

    if (article.status === ArticleStatus.DRAFT && (!user || user.role === Role.User)) {
      throw new AppError('Forbidden. You do not have access to view draft articles.', 403);
    }

    return article;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = mockStore.knowledgeArticles.find((a) => a.id === id);
      if (!found) throw new AppError('Knowledge article not found', 404);
      if (found.status === ArticleStatus.DRAFT && (!user || user.role === Role.User)) {
        throw new AppError('Forbidden. You do not have access to view draft articles.', 403);
      }
      return mockStore.getKnowledgeWithRelations(found);
    }
    throw err;
  }
}

export async function createArticle(
  data: CreateArticleInput,
  authorId: string,
  user: { userId: string; role: Role }
) {
  if (user.role === Role.User) {
    throw new AppError('Forbidden. Only agents and admins can create knowledge articles.', 403);
  }

  if (!data.title || !data.content || !data.category) {
    throw new AppError('Title, content, and category are required.', 400);
  }

  try {
    return await prisma.knowledgeArticle.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category.trim(),
        status: data.status ?? ArticleStatus.DRAFT,
        authorId,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const newArt: MockKnowledgeArticle = {
        id: `kb-${Date.now()}`,
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category.trim(),
        status: data.status ?? ArticleStatus.DRAFT,
        authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.knowledgeArticles.unshift(newArt);
      return mockStore.getKnowledgeWithRelations(newArt);
    }
    throw err;
  }
}

export async function updateArticle(
  id: string,
  data: UpdateArticleInput,
  user: { userId: string; role: Role }
) {
  if (user.role === Role.User) {
    throw new AppError('Forbidden. Only agents and admins can update knowledge articles.', 403);
  }

  try {
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Knowledge article not found', 404);
    }

    const updateData: Prisma.KnowledgeArticleUpdateInput = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.content) updateData.content = data.content.trim();
    if (data.category) updateData.category = data.category.trim();
    if (data.status) updateData.status = data.status;

    return await prisma.knowledgeArticle.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const art = mockStore.knowledgeArticles.find((a) => a.id === id);
      if (!art) throw new AppError('Knowledge article not found', 404);
      if (data.title) art.title = data.title.trim();
      if (data.content) art.content = data.content.trim();
      if (data.category) art.category = data.category.trim();
      if (data.status) art.status = data.status;
      art.updatedAt = new Date();
      return mockStore.getKnowledgeWithRelations(art);
    }
    throw err;
  }
}

export async function deleteArticle(id: string, user: { userId: string; role: Role }) {
  if (user.role !== Role.Admin) {
    throw new AppError('Forbidden. Only administrators can delete knowledge articles.', 403);
  }

  try {
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Knowledge article not found', 404);
    }

    await prisma.knowledgeArticle.delete({ where: { id } });
    return { success: true, message: 'Article deleted successfully' };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const idx = mockStore.knowledgeArticles.findIndex((a) => a.id === id);
      if (idx === -1) throw new AppError('Knowledge article not found', 404);
      mockStore.knowledgeArticles.splice(idx, 1);
      return { success: true, message: 'Article deleted successfully' };
    }
    throw err;
  }
}

export async function suggestArticlesByKeywords(queryText: string) {
  if (!queryText || !queryText.trim()) return [];

  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'have', 'from',
    'they', 'what', 'when', 'where', 'which', 'who', 'how', 'why',
    'are', 'was', 'were', 'not', 'can', 'cant', 'cannot', 'will',
    'wont', 'does', 'doesnt', 'about', 'some', 'any', 'into', 'just', 'been'
  ]);

  const keywords = queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  if (keywords.length === 0) {
    return [];
  }

  try {
    const whereOrConditions: Prisma.KnowledgeArticleWhereInput[] = keywords.flatMap((kw) => [
      { title: { contains: kw, mode: 'insensitive' } },
      { content: { contains: kw, mode: 'insensitive' } },
      { category: { contains: kw, mode: 'insensitive' } },
    ]);

    return await prisma.knowledgeArticle.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        OR: whereOrConditions,
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return mockStore.knowledgeArticles
        .filter((a) => a.status === ArticleStatus.PUBLISHED)
        .filter((a) =>
          keywords.some(
            (kw) =>
              a.title.toLowerCase().includes(kw) ||
              a.content.toLowerCase().includes(kw) ||
              a.category.toLowerCase().includes(kw)
          )
        )
        .slice(0, 5)
        .map((a) => mockStore.getKnowledgeWithRelations(a));
    }
    throw err;
  }
}

