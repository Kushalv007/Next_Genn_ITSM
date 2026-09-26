import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  AlertOctagon,
  GitPullRequest,
  ShoppingBag,
  FileText,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Incidents', icon: AlertTriangle, path: '/incidents' },
  { label: 'Problems', icon: AlertOctagon, path: '/problems' },
  { label: 'Changes', icon: GitPullRequest, path: '/changes' },
  { label: 'Assets', icon: Package, path: '/assets' },
  { label: 'Service Catalog', icon: ShoppingBag, path: '/service-catalog' },
  { label: 'Service Requests', icon: FileText, path: '/requests' },
  { label: 'Knowledge Base', icon: BookOpen, path: '/knowledge' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Admin', icon: Settings, path: '/admin', adminOnly: true },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'Admin';

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {isMobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out lg:static',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen
            ? 'translate-x-0 animate-slide-in-left'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed ? (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">Next Gen ITSM</span>
                <span className="text-[10px] text-slate-400">Enterprise Suite</span>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin p-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    isCollapsed && 'justify-center px-0'
                  )
                }
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isCollapsed ? 'h-6 w-6' : 'h-5 w-5'
                  )}
                />
                {!isCollapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : null}
                {!isCollapsed && item.adminOnly ? (
                  <span className="ml-auto rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    ADMIN
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full items-center justify-center gap-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
