export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink-200 bg-white/60">
      <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-ink-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {year} VIBE ITSM Platform. Step 1 — Initial project setup complete.</p>
        <p className="text-ink-500/80">Built with React · Vite · Tailwind · Express.</p>
      </div>
    </footer>
  );
}
