import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isLoading = isSubmitting || authLoading;

  const fillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    toast.info(`Filled credentials for ${email}`);
  };

  const onSubmit = async (data: LoginFormValues): Promise<void> => {
    try {
      await login(data);
      if (localStorage.getItem('isDemoMode') === 'true') {
        toast.info('Logged in with Demo Account (Interactive Demo Mode active)');
      } else {
        toast.success('Welcome back! Login successful.');
      }
      navigate(from, { replace: true });
    } catch (error) {
      const axiosErr = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosErr.response?.status;
      let message = axiosErr.response?.data?.message;

      if (!message) {
        if (status === 404) {
          message = 'Backend API returned 404 Not Found. If deployed on Vercel, please set VITE_API_URL in your Vercel Project Settings to your live backend URL (e.g., https://your-backend.onrender.com/api).';
        } else if (axiosErr.message === 'Network Error') {
          message = 'Unable to connect to the backend server. Please verify the backend is running.';
        } else {
          message = axiosErr.message || 'Invalid email or password';
        }
      }
      toast.error(message, { duration: 6000 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-slate-500/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/30">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Next Gen ITSM
          </CardTitle>
          <CardDescription className="text-slate-500">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Quick Demo Fill Buttons */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Demo Accounts (1-Click Fill)</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@itsm.com', 'admin123')}
                  className="px-2 py-1.5 text-xs font-medium bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200 transition-colors shadow-sm text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('tech@itsm.com', 'tech123')}
                  className="px-2 py-1.5 text-xs font-medium bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200 transition-colors shadow-sm text-center"
                >
                  Technician
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('user@itsm.com', 'user123')}
                  className="px-2 py-1.5 text-xs font-medium bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200 transition-colors shadow-sm text-center"
                >
                  Employee
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={cn(
                    'pl-10 pr-10',
                    errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              ) : null}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader size="sm" label="Signing in..." />
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center text-sm text-slate-600">
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
