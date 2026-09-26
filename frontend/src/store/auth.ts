import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tokens, AuthState, LoginRequest, RegisterRequest } from '@/types';
import * as authApi from '@/api/auth';

interface AuthStore extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
  setTokens: (tokens: Tokens) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (credentials: LoginRequest): Promise<void> => {
        set({ isLoading: true });
        try {
          const { user, tokens } = await authApi.login(credentials);
          localStorage.removeItem('isDemoMode');
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const status = error?.response?.status;
          const isNetworkOr404 = status === 404 || error?.message === 'Network Error' || !error?.response;
          const emailLower = credentials.email.toLowerCase().trim();

          const demoAccounts: Record<string, { role: 'Admin' | 'Technician' | 'User'; name: string }> = {
            'admin@itsm.com': { role: 'Admin', name: 'System Admin' },
            'tech@itsm.com': { role: 'Technician', name: 'Alex Technician' },
            'user@itsm.com': { role: 'User', name: 'Sarah Employee' },
            'admin@hcl.com': { role: 'Admin', name: 'System Admin' },
            'agent@hcl.com': { role: 'Technician', name: 'Service Agent' },
            'user@hcl.com': { role: 'User', name: 'HCL Employee' },
          };

          if (isNetworkOr404 && demoAccounts[emailLower]) {
            const demo = demoAccounts[emailLower];
            const [firstName, ...lastParts] = demo.name.split(' ');
            const mockUser: User = {
              id: `demo-${demo.role.toLowerCase()}-01`,
              firstName: firstName || 'Demo',
              lastName: lastParts.join(' ') || 'User',
              email: emailLower,
              role: demo.role,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            const mockTokens: Tokens = {
              accessToken: `demo-access-token-${Date.now()}`,
              refreshToken: `demo-refresh-token-${Date.now()}`,
            };

            localStorage.setItem('isDemoMode', 'true');
            localStorage.setItem('accessToken', mockTokens.accessToken);
            localStorage.setItem('refreshToken', mockTokens.refreshToken);
            localStorage.setItem('user', JSON.stringify(mockUser));

            set({
              user: mockUser,
              tokens: mockTokens,
              isAuthenticated: true,
              isLoading: false,
            });

            return;
          }

          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest): Promise<void> => {
        set({ isLoading: true });
        try {
          const { user, tokens } = await authApi.register(data);
          localStorage.removeItem('isDemoMode');
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email: string): Promise<void> => {
        await authApi.forgotPassword({ email });
      },

      logout: (): void => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isDemoMode');
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      restoreSession: async (): Promise<boolean> => {
        set({ isLoading: true });
        const refreshTokenValue = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (!refreshTokenValue && !storedUser) {
          set({ isLoading: false });
          return false;
        }

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser) as User;
            const accessToken = localStorage.getItem('accessToken') || refreshTokenValue || 'demo-token';
            set({
              user,
              tokens: { accessToken, refreshToken: refreshTokenValue || accessToken },
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } catch {
            // parse error
          }
        }

        try {
          let user: User | null = null;
          user = await authApi.getProfile();
          localStorage.setItem('user', JSON.stringify(user));

          const accessToken = localStorage.getItem('accessToken');
          set({
            user,
            tokens: accessToken
              ? { accessToken, refreshToken: refreshTokenValue! }
              : null,
            isAuthenticated: !!accessToken,
            isLoading: false,
          });
          return !!accessToken;
        } catch {
          try {
            if (refreshTokenValue) {
              const newTokens = await authApi.refreshToken(refreshTokenValue);
              localStorage.setItem('accessToken', newTokens.accessToken);
              localStorage.setItem('refreshToken', newTokens.refreshToken);

              const user = await authApi.getProfile();
              localStorage.setItem('user', JSON.stringify(user));

              set({
                user,
                tokens: newTokens,
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            }
            get().logout();
            return false;
          } catch {
            if (storedUser) {
              return true;
            }
            get().logout();
            return false;
          }
        }
      },

      setTokens: (tokens: Tokens): void => {
        set({ tokens });
      },

      setUser: (user: User): void => {
        set({ user });
      },

      setLoading: (loading: boolean): void => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  });
}
