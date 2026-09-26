import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Calendar,
  User as UserIcon,
  Tag,
  BookOpen,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleStatusBadge } from '@/components/ui/StatusBadge';
import { getKnowledgeArticle } from '@/api/knowledge';
import { useAuthStore } from '@/store/auth';
import type { KnowledgeArticle } from '@/types';
import { toast } from 'sonner';

export function KnowledgeDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArticle = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getKnowledgeArticle(id);
      setArticle(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load article';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchArticle();
  }, [fetchArticle]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-800">Article Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">
          The requested knowledge article does not exist or you lack permission to view it.
        </p>
        <Button onClick={() => navigate('/knowledge')} className="mt-4">
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/knowledge')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Base
        </Button>

        {isAgentOrAdmin ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/knowledge/${article.id}/edit`)}
            className="gap-2 text-slate-700"
          >
            <Edit3 className="h-4 w-4" />
            Edit Article
          </Button>
        ) : null}
      </div>

      {/* Article Container */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Article Header */}
        <div className="border-b border-slate-100 bg-slate-50/60 p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                <Tag className="h-3 w-3" />
                {article.category}
              </span>
              {isAgentOrAdmin ? <ArticleStatusBadge status={article.status} /> : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {article.title}
            </h1>

            {/* Author and Date Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Author:{' '}
                  <strong className="text-slate-700">
                    {article.author
                      ? `${article.author.firstName} ${article.author.lastName}`
                      : 'System'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Last updated:{' '}
                  <strong className="text-slate-700">
                    {new Date(article.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content Body */}
        <CardContent className="p-6 sm:p-8">
          <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-slate-800">
            {article.content}
          </div>

          {/* Helpfulness & Followup Box */}
          <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Did this article solve your problem?
                </h4>
                <p className="text-xs text-blue-700">
                  If you still need assistance, our IT support team is standing by to help.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
                >
                  <Link to="/incidents/new">
                    <AlertTriangle className="h-4 w-4" />
                    Report Incident
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
