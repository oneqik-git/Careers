'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNav({ items = [] }) {
  const pathname = usePathname();

  if (!items.length) {
    return null;
  }

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            className={`rounded-full px-4 py-2 text-sm transition ${
              isActive
                ? 'bg-slate-950 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
