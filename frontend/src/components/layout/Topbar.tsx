import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Menu,
  CheckCheck,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/api/notifications';
import type { Notification } from '@/types';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

function formatTimeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps): JSX.Element {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchNotificationsData = useCallback(async () => {
    if (!user) return;
    try {
      const [list, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // Background silent fail
    }
  }, [user]);

  useEffect(() => {
    void fetchNotificationsData();
    const interval = setInterval(() => {
      void fetchNotificationsData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotificationsData]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Continue navigation even if read marking errors
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleLogout = (): void => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials =
    user && user.firstName && user.lastName
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
      : user?.email.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleMobileSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search incidents, users, articles..."
          className="w-full pl-10 pr-4 bg-slate-50 border-slate-200 focus:bg-white"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell Dropdown */}
        <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 ? (
                <Badge
                  variant="critical"
                  className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-[10px] rounded-full"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 sm:w-96 p-0" align="end" forceMount>
            <div className="flex items-center justify-between border-b border-slate-100 p-3.5 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    {unreadCount} new
                  </span>
                ) : null}
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              ) : null}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">No notifications yet</p>
                  <p className="text-[11px] text-slate-400">
                    You'll be notified when tickets or requests are updated.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      void handleNotificationClick(n);
                      setIsNotificationsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                      !n.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full">
                      {!n.isRead ? <div className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100"
            >
              <Avatar className="h-9 w-9 border-2 border-slate-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                  {user?.role ?? 'User'}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex w-full cursor-pointer items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
