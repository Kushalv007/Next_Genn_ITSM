import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import { useApiHealth } from '../hooks/useApiHealth.js';
import cn from '../utils/cn.js';

export default function Home() {
  const { data, loading, error, retry } = useApiHealth();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-20">
      {/* Hero */}
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <Badge tone="brand">Step 1 · Project Setup</Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900">
            Next-Gen{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-900 bg-clip-text text-transparent">
              IT Service Management
            </span>
          </h1>
          <p className="mt-4 text-lg text-ink-500 leading-relaxed">
            A modern, enterprise-grade ITSM platform. This page is a <b>test page</b>{' '}
            proving the frontend scaffold works end-to-end: React + Vite + React Router +
            Tailwind CSS + Axios + Lucide React.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white border border-ink-200 shadow-soft px-4 py-3 text-sm">
              <p className="text-ink-500 text-xs uppercase tracking-wide">Modules coming next</p>
              <p className="font-semibold text-ink-900 mt-0.5">Auth · Incidents · Services · Approvals · KB · SLA …</p>
            </div>
          </div>
        </div>

        <div id="status" className="rounded-3xl bg-white border border-ink-200 shadow-soft p-6 sm:p-8">
          <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">API Health Check</h2>
          <button
            type="button"
            onClick={retry}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Refresh
          </button>
        </div>
          <p className="text-sm text-ink-500 mt-1">
            Calls <code className="px-1.5 px-2 rounded bg-ink-100 text-ink-700 text-xs">GET /api/health</code> via Axios
          </p>

          <div className="mt-6 rounded-2xl border border-ink-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-ink-50/60 border-b border-ink-200">
            <span className="text-sm font-medium text-ink-700">Status</span>
            {loading ? (
              <Badge tone="warning">
                <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> Checking…
              </Badge>
            ) : error ? (
              <Badge tone="danger">Unreachable</Badge>
            ) : data?.success ? (
              <Badge tone="success">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Healthy
              </Badge>
            ) : (
              <Badge>Unknown</Badge>
            )}
          </div>

            <div className="px-4 py-4">
            <pre className={cn(
              'text-xs font-mono whitespace-pre-wrap break-all',
              loading || error ? 'text-ink-500' : 'text-ink-700'
            )}>
{loading
  ? '// waiting for response...'
  : error
  ? `// Could not reach server at ${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/health\n` +
    '// Make sure `npm run dev:server` is running.\n\n' +
    JSON.stringify({ error: error.message }, null, 2)
  : JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="mt-20">
        <h2 className="text-2xl font-semibold text-ink-900">Scaffold includes</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'React Router',  text: 'Page routing with layout wrapper and NotFound 404 page.' },
            { title: 'Tailwind CSS',  text: 'Custom brand + ink palette, responsive layout.' },
            { title: 'Axios client',   text: 'Pre-configured service layer with baseURL env var.' },
            { title: 'Lucide React', text: 'Modern icon set used throughout the UI.' },
            { title: 'Context ready',  text: 'AppContext scaffolded for future providers.' },
            { title: 'Clean layout',text: 'Header / Main / Footer shell. Ready for ITSM pages.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft hover:-translate-y-0.5 transition-transform">
              <p className="font-semibold text-ink-900">{f.title}</p>
              <p className="mt-1 text-sm text-ink-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mt-20 rounded-2xl border border-dashed border-ink-200 bg-white p-6 sm:p-10 text-ink-700">
        <h2 className="text-xl font-semibold text-ink-900">Next steps (not implemented yet)</h2>
        <ul className="mt-4 list-disc list-inside space-y-1.5 text-sm">
          <li>Authentication (JWT sessions & role based access control</li>
          <li>Incident / Service Request / Approval management modules</li>
          <li>Dashboard with KPIs & analytics</li>
          <li>Knowledge base, SLA engine & AI Copilot</li>
        </ul>
      </section>
    </div>
  );
}
