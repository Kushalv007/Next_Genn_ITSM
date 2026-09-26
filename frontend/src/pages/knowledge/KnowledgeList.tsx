import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Plus,
  ArrowRight,
  User as UserIcon,
  Tag,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleStatusBadge } from '@/components/ui/StatusBadge';
import { getKnowledgeArticles } from '@/api/knowledge';
import { useAuthStore } from '@/store/auth';
import type { KnowledgeArticle } from '@/types';
import { toast } from 'sonner';

const CATEGORIES = [
  'ALL',
  'Software',
  'Hardware',
  'Network',
  'Access',
  'Email',
  'Cloud Infrastructure',
  'Other',
];

export function KnowledgeList(): JSX.Element {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getKnowledgeArticles({
        search: searchTerm,
        category: selectedCategory,
        status: isAgentOrAdmin ? selectedStatus : 'PUBLISHED',
      });
      setArticles(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load knowledge articles';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedStatus, isAgentOrAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchArticles();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5 text-blue-300" />
            <span>Self-Service & Documentation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Knowledge Base
          </h1>
          <p className="text-sm text-blue-100 sm:text-base">
            Find answers, step-by-step troubleshooting guides, and IT solutions to resolve common issues quickly.
          </p>

          {/* Quick Search in Hero */}
          <div className="relative pt-2">
            <Search className="absolute left-3.5 top-5 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search articles by title, keywords, or issue description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-lg border-0 bg-white pl-11 pr-4 text-slate-900 shadow-lg placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-400"
            />
          </div>
        </div>

        {/* Action Button for Agents/Admins */}
        {isAgentOrAdmin ? (
          <div className="relative z-10 mt-6 sm:absolute sm:right-8 sm:top-8 sm:mt-0">
            <Button
              onClick={() => navigate('/knowledge/new')}
              className="gap-2 bg-white text-blue-900 hover:bg-blue-50 shadow-md font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          </div>
        ) : null}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Status Filter for Agents/Admins */}
        {isAgentOrAdmin ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
            </select>
          </div>
        ) : null}
      </div>

      {/* Article Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Skeleton key={idx} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-800">No articles found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            We couldn't find any knowledge articles matching your criteria. Try adjusting your search query or category filter.
          </p>
          {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card
              key={article.id}
              onClick={() => navigate(`/knowledge/${article.id}`)}
              className="group cursor-pointer border-slate-200 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      <Tag className="h-3 w-3" />
                      {article.category}
                    </span>
                    {isAgentOrAdmin ? <ArticleStatusBadge status={article.status} /> : null}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {article.content}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {article.author
                        ? `${article.author.firstName} ${article.author.lastName}`
                        : 'System'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Read</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
