import { Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-ink-200">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-ink-900">VIBE</p>
            <p className="text-xs text-ink-500">Next-Gen ITSM</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-700">
          <a className="hover:text-brand-600 transition-colors" href="#features">
            Features
          </a>
          <a className="hover:text-brand-600 transition-colors" href="#status">
            API Status
          </a>
          <a className="hover:text-brand-600 transition-colors" href="#about">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
