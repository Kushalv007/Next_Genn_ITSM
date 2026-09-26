import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Toaster } from '@/components/ui/toast';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { IncidentList } from '@/pages/incidents/IncidentList';
import { NewIncident } from '@/pages/incidents/NewIncident';
import { IncidentDetail } from '@/pages/incidents/IncidentDetail';
import { ServiceCatalog } from '@/pages/catalog/ServiceCatalog';
import { RequestList } from '@/pages/requests/RequestList';
import { RequestDetail } from '@/pages/requests/RequestDetail';
import { KnowledgeList } from '@/pages/knowledge/KnowledgeList';
import { KnowledgeDetail } from '@/pages/knowledge/KnowledgeDetail';
import { KnowledgeEditor } from '@/pages/knowledge/KnowledgeEditor';
import { ProblemList } from '@/pages/problems/ProblemList';
import { NewProblem } from '@/pages/problems/NewProblem';
import { ProblemDetail } from '@/pages/problems/ProblemDetail';
import { ChangeList } from '@/pages/changes/ChangeList';
import { NewChange } from '@/pages/changes/NewChange';
import { ChangeDetail } from '@/pages/changes/ChangeDetail';
import { AssetList } from '@/pages/assets/AssetList';
import { AssetDetail } from '@/pages/assets/AssetDetail';
import { useAuthStore } from '@/store/auth';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle } from 'lucide-react';

function NotFound(): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <EmptyState
        icon={AlertTriangle}
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        action={{
          label: 'Go to Dashboard',
          onClick: () => navigate('/dashboard'),
        }}
      />
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <EmptyState
        title={`${title} - Coming Soon`}
        description={`This ${title.toLowerCase()} module is currently under development. Check back soon for updates.`}
        action={{
          label: 'Go to Dashboard',
          onClick: () => navigate('/dashboard'),
        }}
      />
    </div>
  );
}

function AuthRedirect(): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (isAuthenticated) {
    return <Navigate to={from ?? '/dashboard'} replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes(): JSX.Element {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const init = async (): Promise<void> => {
      const tokens = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
      if (tokens && !isAuthenticated) {
        await restoreSession();
      } else if (!tokens) {
        useAuthStore.getState().setLoading(false);
      }
    };
    void init();
  }, [restoreSession, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader size="xl" label="Loading application..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AuthRedirect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Step 5: Core ITSM Ticketing */}
        <Route path="/incidents" element={<IncidentList />} />
        <Route path="/incidents/new" element={<NewIncident />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />

        <Route path="/service-catalog" element={<ServiceCatalog />} />
        <Route path="/requests" element={<RequestList />} />
        <Route path="/requests/:id" element={<RequestDetail />} />

        {/* Step 6: Smart ITSM Features - Knowledge Base */}
        <Route path="/knowledge" element={<KnowledgeList />} />
        <Route path="/knowledge/new" element={<KnowledgeEditor />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="/knowledge/:id/edit" element={<KnowledgeEditor />} />
        <Route path="/knowledge-base" element={<Navigate to="/knowledge" replace />} />

        {/* Step 7: Enterprise Management */}
        {/* Problem Management */}
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/new" element={<NewProblem />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />

        {/* Change Management */}
        <Route path="/changes" element={<ChangeList />} />
        <Route path="/changes/new" element={<NewChange />} />
        <Route path="/changes/:id" element={<ChangeDetail />} />

        {/* Asset Management */}
        <Route path="/assets" element={<AssetList />} />
        <Route path="/assets/:id" element={<AssetDetail />} />

        {/* Placeholders for Future Steps */}
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </BrowserRouter>
  );
}
