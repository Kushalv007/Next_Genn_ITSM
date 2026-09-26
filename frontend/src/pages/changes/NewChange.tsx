import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  GitPullRequest,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createChange } from '@/api/changes';
import type { ChangeRisk } from '@/types';
import { toast } from 'sonner';

interface NewChangeFormValues {
  title: string;
  description: string;
  risk: ChangeRisk;
  implementationPlan: string;
  rollbackPlan: string;
  scheduledDate?: string;
}

export function NewChange(): JSX.Element {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewChangeFormValues>({
    defaultValues: {
      risk: 'LOW',
    },
  });

  const onSubmit = async (values: NewChangeFormValues) => {
    try {
      setIsSubmitting(true);
      const created = await createChange({
        ...values,
        scheduledDate: values.scheduledDate || null,
      });
      toast.success(`Change request ${created.changeNumber} created successfully`);
      navigate(`/changes/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create change request';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/changes')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Changes
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Submit Change Request
              </CardTitle>
              <CardDescription>
                Define the technical scope, risk assessment, execution steps, and back-out strategy for production changes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-800">
                Change Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. Upgrade Core Switch Stack Firmware to v17.9"
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Minimum 5 characters' },
                  maxLength: { value: 200, message: 'Maximum 200 characters' },
                })}
              />
              {errors.title ? (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              ) : null}
            </div>

            {/* Risk & Scheduled Date Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="risk" className="text-sm font-semibold text-slate-800">
                  Risk Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="risk"
                  {...register('risk', { required: true })}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low (Routine maintenance, minimal blast radius)</option>
                  <option value="MEDIUM">Medium (Moderate impact, redundant paths available)</option>
                  <option value="HIGH">High (Potential downtime to business-critical services)</option>
                  <option value="CRITICAL">Critical (Major infrastructure alteration / high risk)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="scheduledDate" className="text-sm font-semibold text-slate-800">
                  Scheduled Execution Date
                </label>
                <Input
                  id="scheduledDate"
                  type="date"
                  {...register('scheduledDate')}
                  className="w-full bg-white"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-800">
                Change Reason & Overview <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Business justification, architectural context, and systems impacted..."
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Please provide at least 10 characters' },
                })}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              ) : null}
            </div>

            {/* Implementation Plan */}
            <div className="space-y-2">
              <label htmlFor="implementationPlan" className="text-sm font-semibold text-slate-800">
                Implementation Plan (Step-by-Step) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="implementationPlan"
                rows={5}
                placeholder="1. Pre-checks and backups...&#10;2. Apply configuration / software patch...&#10;3. Verification checks..."
                {...register('implementationPlan', {
                  required: 'Implementation plan is required',
                  minLength: { value: 10, message: 'Please detail implementation steps' },
                })}
                className="w-full rounded-md border border-slate-200 bg-white p-3 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.implementationPlan ? (
                <p className="text-xs text-red-500">{errors.implementationPlan.message}</p>
              ) : null}
            </div>

            {/* Rollback Plan */}
            <div className="space-y-2">
              <label htmlFor="rollbackPlan" className="text-sm font-semibold text-slate-800">
                Rollback Plan (Back-Out Strategy) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rollbackPlan"
                rows={4}
                placeholder="Detailed steps to revert system to previous known good state if unforeseen errors occur during verification..."
                {...register('rollbackPlan', {
                  required: 'Rollback plan is required',
                  minLength: { value: 10, message: 'Please detail rollback strategy' },
                })}
                className="w-full rounded-md border border-slate-200 bg-white p-3 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.rollbackPlan ? (
                <p className="text-xs text-red-500">{errors.rollbackPlan.message}</p>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/changes')}
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
                    Submit Change
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
