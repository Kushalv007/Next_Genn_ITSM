import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 grid place-items-center ring-1 ring-inset ring-rose-100">
          <XCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-2 text-ink-500">The URL you visited does not exist yet.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
