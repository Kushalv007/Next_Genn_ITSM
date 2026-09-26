import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  BookOpen,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  getKnowledgeArticle,
  createKnowledgeArticle,
  updateKnowledgeArticle,
} from '@/api/knowledge';
import { useAuthStore } from '@/store/auth';
import type { ArticleStatus } from '@/types';
import { toast } from 'sonner';

interface ArticleFormValues {
  title: string;
  category: string;
  content: string;
  status: ArticleStatus;
}

const CATEGORIES = [
  'Software',
  'Hardware',
  'Network',
  'Access',
  'Email',
  'Cloud Infrastructure',
  'Other',
];

export function KnowledgeEditor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    defaultValues: {
      category: 'Software',
      status: 'PUBLISHED',
    },
  });

  useEffect(() => {
    if (!isAgentOrAdmin) {
      toast.error('Forbidden. Only agents and administrators can manage articles.');
      navigate('/knowledge');
      return;
    }

    if (isEditing && id) {
      setIsLoading(true);
      getKnowledgeArticle(id)
        .then((article) => {
          setValue('title', article.title);
          setValue('category', article.category);
          setValue('content', article.content);
          setValue('status', article.status);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load article';
          toast.error(msg);
          navigate('/knowledge');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditing, isAgentOrAdmin, navigate, setValue]);

  const onSubmit = async (values: ArticleFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        const updated = await updateKnowledgeArticle(id, values);
        toast.success('Knowledge article updated successfully');
        navigate(`/knowledge/${updated.id}`);
      } else {
        const created = await createKnowledgeArticle(values);
        toast.success('Knowledge article created successfully');
        navigate(`/knowledge/${created.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save article';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(isEditing ? `/knowledge/${id}` : '/knowledge')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEditing ? 'Cancel & Return to Article' : 'Back to Knowledge Base'}
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                {isEditing ? 'Edit Knowledge Article' : 'Create Knowledge Article'}
              </CardTitle>
              <CardDescription>
                Author comprehensive troubleshooting guides, FAQs, or technical documentation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-800">
                Article Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. How to Connect to Corporate VPN from Windows 11"
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Minimum 5 characters' },
                  maxLength: { value: 200, message: 'Maximum 200 characters' },
                })}
              />
              {errors.title ? (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              ) : (
                <p className="text-xs text-slate-400">Clear, searchable title outlining the solution or topic.</p>
              )}
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-semibold text-slate-800">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  {...register('category', { required: 'Please select a category' })}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="text-xs text-red-500">{errors.category.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-semibold text-slate-800">
                  Publication Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  {...register('status', { required: true })}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLISHED">Published (Visible to all employees)</option>
                  <option value="DRAFT">Draft (Only visible to technicians & admins)</option>
                </select>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-semibold text-slate-800">
                Article Content & Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                rows={12}
                placeholder="Provide detailed step-by-step instructions, troubleshooting tips, prerequisites, and common pitfalls..."
                {...register('content', {
                  required: 'Article content is required',
                  minLength: { value: 20, message: 'Please provide at least 20 characters of instructions' },
                })}
                className="w-full rounded-md border border-slate-200 bg-white p-3 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.content ? (
                <p className="text-xs text-red-500">{errors.content.message}</p>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEditing ? `/knowledge/${id}` : '/knowledge')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Publish Article
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
