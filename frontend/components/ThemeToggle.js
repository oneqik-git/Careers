'use client';

import { useTheme } from '@/components/ThemeProvider';

export default function ThemeToggle({ className = '' }) {
  const { isReady, theme, toggleTheme } = useTheme();
  const nextLabel = theme === 'dark' ? 'Light' : 'Dark';

  return (
    <button
      className={`oq-button-secondary inline-flex items-center gap-2 ${className}`.trim()}
      onClick={toggleTheme}
      type="button"
    >
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
      {isReady ? nextLabel : 'Theme'}
    </button>
  );
}
