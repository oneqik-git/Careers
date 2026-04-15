'use client';

import { useTheme } from '@/components/ThemeProvider';

export default function ThemeToggle({ className = '', tone = 'default' }) {
  const { isReady, theme, toggleTheme } = useTheme();
  const nextLabel = theme === 'dark' ? 'Light' : 'Dark';
  const isDark = theme !== 'light';
  const isPublic = tone === 'public';

  return (
    <button
      aria-label={`Switch to ${nextLabel.toLowerCase()} theme`}
      className={`group inline-flex h-9 items-center rounded-full border border-[var(--dark-1)] bg-[var(--dark-pallet)] px-1 transition-all duration-200 ${isPublic ? 'hover:border-[rgba(93,224,230,0.22)]' : 'shadow-[var(--shadow-soft)] hover:border-[rgba(93,224,230,0.18)]'} ${className}`.trim()}
      onClick={toggleTheme}
      type="button"
    >
      <span className="sr-only">{isReady ? nextLabel : 'Theme'}</span>
      <span className="relative inline-flex w-[2.8rem] items-center">
        <span className="absolute left-1.5 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[var(--graytexts)]">
          D
        </span>
        <span className="absolute right-1.5 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[var(--graytexts)]">
          L
        </span>
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[0.58rem] font-semibold transition-transform duration-200 ${isPublic ? 'border border-[rgba(93,224,230,0.18)] bg-[rgba(9,12,17,0.92)] text-[var(--secondary-1)] group-hover:border-[rgba(93,224,230,0.26)] group-hover:text-[var(--white)]' : 'border border-[var(--dark-1)] bg-[linear-gradient(90deg,var(--primary-2)_0%,var(--primary-5)_100%)] text-[#041429] shadow-[0_0_18px_rgba(93,224,230,0.24)]'} ${isDark ? 'translate-x-0' : 'translate-x-[0.92rem]'}`.trim()}
        >
          {isReady ? (isDark ? 'D' : 'L') : 'T'}
        </span>
      </span>
    </button>
  );
}
