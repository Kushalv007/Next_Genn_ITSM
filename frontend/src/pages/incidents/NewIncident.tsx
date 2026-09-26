import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  AlertTriangle,
  Send,
  Loader2,
  BookOpen,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createIncident } from '@/api/incidents';
import { suggestArticles } from '@/api/knowledge';
import { getAssets } from '@/api/assets';
import type { IncidentPriority, KnowledgeArticle, Asset } from '@/types';
import { toast } from 'sonner';

interface NewIncidentFormValues {
  shortDescription: string;
  description: string;
  category: string;
  priority: IncidentPriority;
  assetId?: string;
}

const CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Access',
  'Email',
  'Cloud Infrastructure',
  'Other',
];

export function NewIncident(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('assetId') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<KnowledgeArticle[]>([]);
  const [isSearchingArticles, setIsSearchingArticles] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewIncidentFormValues>({
    defaultValues: {
      category: 'Software',
      priority: 'MEDIUM',
      assetId: preselectedAssetId,
    },
  });

  useEffect(() => {
    getAssets().then(setAssets).catch(() => {});
    if (preselectedAssetId) {
      setValue('assetId', preselectedAssetId);
    }
  }, [preselectedAssetId, setValue]);

  const shortDescriptionValue = watch('shortDescription');

  useEffect(() => {
    if (!shortDescriptionValue || shortDescriptionValue.trim().length < 3) {
      setSuggestedArticles([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingArticles(true);
        const results = await suggestArticles(shortDescriptionValue);
        setSuggestedArticles(results);
      } catch {
        setSuggestedArticles([]);
      } finally {
        setIsSearchingArticles(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [shortDescriptionValue]);

  const onSubmit = async (values: NewIncidentFormValues) => {
    try {
      setIsSubmitting(true);
      const created = await createIncident({
        shortDescription: values.shortDescription,
        description: values.description,
        category: values.category,
        priority: values.priority,
        assetId: values.assetId ? values.assetId : undefined,
      });
      toast.success(`Incident ${created.ticketNumber} created successfully`);
      navigate(`/incidents/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create incident';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/incidents')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Report a New Incident
              </CardTitle>
              <CardDescription>
                Submit details regarding an unplanned interruption or reduction in quality of an IT service.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Short Description */}
            <div className="space-y-2">
              <label htmlFor="shortDescription" className="text-sm font-semibold text-slate-800">
                Short Description <span className="text-red-500">*</span>
              </label>
              <Input
                id="shortDescription"
                placeholder="e.g. Cannot access VPN from remote office"
                {...register('shortDescription', {
                  required: 'Short description is required',
                  minLength: { value: 5, message: 'Minimum 5 characters' },
                  maxLength: { value: 160, message: 'Maximum 160 characters' },
                })}
              />
              {errors.shortDescription ? (
                <p className="text-xs text-red-500">{errors.shortDescription.message}</p>
              ) : (
                <p className="text-xs text-slate-400">A concise, single-line summary of the issue.</p>
              )}

              {/* Related Knowledge Articles Suggestions */}
              {isSearchingArticles ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Searching knowledge base for matching solutions...</span>
                </div>
              ) : suggestedArticles.length > 0 ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Relevant Knowledge Articles Found</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Before submitting an incident, check if one of these solutions resolves your issue:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {suggestedArticles.map((art) => (
                      <div
                        key={art.id}
                        className="flex items-center justify-between rounded-md border border-blue-100 bg-white p-2.5 shadow-2xs hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-xs font-medium text-slate-800 truncate">
                            {art.title}
                          </span>
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {art.category}
                          </span>
                        </div>
                        <a
                          href={`/knowledge/${art.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>View</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Category and Priority Grid */}
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
                <label htmlFor="priority" className="text-sm font-semibold text-slate-800">
                  Impact / Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  {...register('priority', { required: true })}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low (Minimal disruption to individual)</option>
                  <option value="MEDIUM">Medium (Moderate impact, workaround available)</option>
                  <option value="HIGH">High (Major impairment of primary function)</option>
                  <option value="CRITICAL">Critical (Company-wide system down)</option>
                </select>
              </div>
            </div>

            {/* Affected Asset (Optional) */}
            <div className="space-y-2">
              <label htmlFor="assetId" className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                <span>Affected Hardware Asset</span>
                <span className="text-xs text-slate-400 font-normal">Optional</span>
              </label>
              <select
                id="assetId"
                {...register('assetId')}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None / Not specific to hardware</option>
                {assets.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    [{ast.assetTag}] {ast.name} — {ast.model} ({ast.status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Link this trouble ticket to a specific enterprise computer, workstation, server, or printer.
              </p>
            </div>

            {/* Full Detailed Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-800">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="Describe what happened, error messages received, steps to reproduce, and any troubleshooting already attempted..."
                {...register('description', {
                  required: 'Detailed description is required',
                  minLength: { value: 10, message: 'Please provide at least 10 characters' },
                })}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/incidents')}
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Incident
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
