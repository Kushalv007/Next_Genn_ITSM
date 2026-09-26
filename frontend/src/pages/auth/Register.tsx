import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const registerSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(2, { message: 'First name must be at least 2 characters' })
      .max(50, { message: 'First name cannot exceed 50 characters' }),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(2, { message: 'Last name must be at least 2 characters' })
      .max(50, { message: 'Last name cannot exceed 50 characters' }),
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Please enter a valid email address' }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    confirmPassword: z.string({
      required_error: 'Please confirm your password',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordRequirement({
  label,
  met,
}: {
  label: string;
  met: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          met ? 'text-emerald-500' : 'text-slate-300'
        )}
      />
      <span
        className={cn(
          'text-xs',
          met ? 'text-emerald-600' : 'text-slate-500'
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function Register(): JSX.Element {
  const navigate = useNavigate();
  const { register: registerUser, isLoading: authLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Passwords match', met: !!confirmPassword && password === confirmPassword },
  ];

  const isLoading = isSubmitting || authLoading;

  const onSubmit = async (data: RegisterFormValues): Promise<void> => {
    try {
      await registerUser(data);
      toast.success('Account created successfully! Welcome to Next Gen ITSM.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-slate-500/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-lg border-slate-200 shadow-xl">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/30">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-500">
            Join Next Gen ITSM and start managing your IT services
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-slate-700"
                >
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="John"
                    className={cn(
                      'pl-10',
                      errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''
                    )}
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName ? (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-slate-700"
                >
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    className={cn(
                      'pl-10',
                      errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''
                    )}
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName ? (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                ) : null}
              </div>
            </div>

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
                  placeholder="john@company.com"
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

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
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

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  className={cn(
                    'pl-10 pr-10',
                    errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
                  )}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              ) : null}
            </div>

            {password || confirmPassword ? (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Password Requirements:
                </p>
                {requirements.map((req) => (
                  <PasswordRequirement
                    key={req.label}
                    label={req.label}
                    met={req.met}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader size="sm" label="Creating account..." />
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
