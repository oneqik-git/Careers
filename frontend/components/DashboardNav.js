'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNav({ items = [] }) {
  const pathname = usePathname();

  if (!items.length) {
    return null;
  }

  return (
    <nav className="oq-card-muted mb-8 rounded-[28px] p-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              className={`oq-nav-pill ${isActive ? 'oq-nav-pill-active' : ''}`.trim()}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
