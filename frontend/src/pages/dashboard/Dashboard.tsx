import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  UserRound,
  Clock,
  CheckSquare,
  BookOpen,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardData {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend: {
    value: number;
    isUp: boolean;
  };
  gradient: string;
  iconBg: string;
  badgeVariant: 'default' | 'secondary' | 'open' | 'progress' | 'resolved' | 'closed' | 'critical';
}

const statCardData: StatCardData[] = [
  {
    title: 'Total Incidents',
    value: 1247,
    icon: AlertCircle,
    trend: { value: 12.5, isUp: true },
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/15 text-blue-600',
    badgeVariant: 'progress',
  },
  {
    title: 'Open Incidents',
    value: 283,
    icon: AlertTriangle,
    trend: { value: 5.2, isUp: false },
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/15 text-amber-600',
    badgeVariant: 'open',
  },
  {
    title: 'My Tickets',
    value: 42,
    icon: UserRound,
    trend: { value: 8.1, isUp: true },
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-500/15 text-emerald-600',
    badgeVariant: 'resolved',
  },
  {
    title: 'SLA Breached',
    value: 17,
    icon: Clock,
    trend: { value: 23.4, isUp: true },
    gradient: 'from-red-500/10 via-red-500/5 to-transparent',
    iconBg: 'bg-red-500/15 text-red-600',
    badgeVariant: 'critical',
  },
  {
    title: 'Pending Approvals',
    value: 36,
    icon: CheckSquare,
    trend: { value: 3.7, isUp: false },
    gradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
    iconBg: 'bg-violet-500/15 text-violet-600',
    badgeVariant: 'secondary',
  },
  {
    title: 'Knowledge Articles',
    value: 892,
    icon: BookOpen,
    trend: { value: 15.3, isUp: true },
    gradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
    iconBg: 'bg-sky-500/15 text-sky-600',
    badgeVariant: 'default',
  },
];

function StatCardSkeleton(): JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  data: StatCardData;
  delay: number;
}

function StatCard({ data, delay }: StatCardProps): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(mountTimer);
  }, [delay]);

  useEffect(() => {
    if (!mounted) return;
    const numericValue = typeof data.value === 'number' ? data.value : 0;
    const duration = 800;
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [mounted, data.value]);

  const Icon = data.icon;
  const displayVal = typeof data.value === 'number' ? displayValue.toLocaleString() : data.value;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br pointer-events-none opacity-60',
          data.gradient
        )}
      />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">{data.title}</p>
            <div>
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {displayVal}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {data.trend.isUp ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-semibold',
                  data.trend.isUp ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {data.trend.isUp ? '+' : ''}
                {data.trend.value}%
              </span>
              <span className="text-sm text-slate-400">vs last week</span>
            </div>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              data.iconBg
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Welcome back! Here&apos;s an overview of your IT service management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <StatCardSkeleton key={`skeleton-${index}`} />
            ))
          : statCardData.map((stat, index) => (
              <StatCard
                key={stat.title}
                data={stat}
                delay={index * 80}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
              <span className="text-xs text-slate-400">Today</span>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { text: 'INC-0241 opened by Sarah Chen', time: '2 min ago', color: 'bg-amber-500' },
                  { text: 'INC-0238 assigned to you', time: '15 min ago', color: 'bg-blue-500' },
                  { text: 'INC-0235 resolved successfully', time: '1 hr ago', color: 'bg-emerald-500' },
                  { text: 'KB-0089 article published', time: '3 hr ago', color: 'bg-sky-500' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                    <p className="flex-1 text-sm text-slate-700">{item.text}</p>
                    <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Incidents by Status</h3>
              <span className="text-xs text-slate-400">Current</span>
            </div>
            {isLoading ? (
              <div className="space-y-4 pt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {[
                  { label: 'Open', value: 128, total: 283, color: 'bg-amber-500', pct: 45 },
                  { label: 'In Progress', value: 97, total: 283, color: 'bg-blue-500', pct: 34 },
                  { label: 'Resolved', value: 41, total: 283, color: 'bg-emerald-500', pct: 15 },
                  { label: 'Critical', value: 17, total: 283, color: 'bg-red-500', pct: 6 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{item.label}</span>
                      <span className="text-slate-900 font-semibold">{item.value}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', item.color)}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
