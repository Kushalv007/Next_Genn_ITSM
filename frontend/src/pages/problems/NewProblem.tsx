import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  AlertOctagon,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createProblem } from '@/api/problems';
import { getAgents } from '@/api/incidents';
import type { User } from '@/types';
import { toast } from 'sonner';

interface NewProblemFormValues {
  title: string;
  description: string;
  ownerId?: string;
  rootCause?: string;
  workaround?: string;
}

export function NewProblem(): JSX.Element {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewProblemFormValues>();

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch(() => toast.error('Failed to load agents list'));
  }, []);

  const onSubmit = async (values: NewProblemFormValues) => {
    try {
      setIsSubmitting(true);
      const created = await createProblem(values);
      toast.success(`Problem ${created.problemNumber} created successfully`);
      navigate(`/problems/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create problem';
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
          onClick={() => navigate('/problems')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Problems
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Log New Problem Investigation
              </CardTitle>
              <CardDescription>
                Track root causes, formulate temporary workarounds, and link affected incidents to prevent recurrence.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-800">
                Problem Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. Intermittent VPN Gateway Drops Across Remote Offices"
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

            {/* Owner Assignment */}
            <div className="space-y-2">
              <label htmlFor="ownerId" className="text-sm font-semibold text-slate-800">
                Problem Owner / Lead Investigator
              </label>
              <select
                id="ownerId"
                {...register('ownerId')}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Assign to Me (Current User) --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.firstName} {ag.lastName} ({ag.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-800">
                Problem Description & Symptoms <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe recurring symptoms, affected services, error patterns, and scope of impact..."
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

            {/* Workaround */}
            <div className="space-y-2">
              <label htmlFor="workaround" className="text-sm font-semibold text-slate-800">
                Known Workaround (Temporary Mitigation)
              </label>
              <textarea
                id="workaround"
                rows={3}
                placeholder="Document any known interim recovery steps to restore partial service before permanent fix..."
                {...register('workaround')}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Root Cause */}
            <div className="space-y-2">
              <label htmlFor="rootCause" className="text-sm font-semibold text-slate-800">
                Known Root Cause (If identified)
              </label>
              <textarea
                id="rootCause"
                rows={3}
                placeholder="Underlying hardware/software defect, configuration flaw, or environmental trigger..."
                {...register('rootCause')}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/problems')}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Log Problem
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
