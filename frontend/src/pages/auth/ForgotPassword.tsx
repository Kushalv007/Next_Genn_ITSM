import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword(): JSX.Element {
  const { forgotPassword, isLoading: authLoading } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const isLoading = isSubmitting || authLoading;

  const onSubmit = async (data: ForgotPasswordFormValues): Promise<void> => {
    try {
      await forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success('If an account exists with that email, a reset link has been sent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-slate-500/10 blur-3xl" />
        </div>

        <Card className="relative w-full max-w-md border-slate-200 shadow-xl">
          <CardContent className="pt-10 pb-8 px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Check Your Email
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We&apos;ve sent password reset instructions to the email address you provided.
              Please check your inbox and follow the link to reset your password.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 h-11 rounded-md px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
              <p className="text-xs text-slate-400">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-slate-500/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/30">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Reset Password
          </CardTitle>
          <CardDescription className="text-slate-500">
            Enter your email and we&apos;ll send you reset instructions
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={cn(
                    'pl-10',
                    errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                  )}
                  {...register('email')}
                />
              </div>
              {errors.email ? (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              ) : null}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader size="sm" label="Sending..." />
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <div className="text-center text-sm text-slate-600 pt-2">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Create one
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
