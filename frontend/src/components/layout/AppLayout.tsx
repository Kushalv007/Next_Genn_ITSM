import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/store/auth';

export function AppLayout(): JSX.Element {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleToggleCollapse = React.useCallback((): void => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleToggleMobileSidebar = React.useCallback((): void => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const handleCloseMobile = React.useCallback((): void => {
    setIsMobileOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader size="xl" label="Loading application..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onToggleMobileSidebar={handleToggleMobileSidebar} />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
