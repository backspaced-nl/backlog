'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-40 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12x-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link
            href="/"
            className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 648 216" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--foreground)]">
              <path d="M0 0H216V108C216 167.647 167.647 216 108 216C48.3533 216 0 167.647 0 108V0Z" fill="currentColor"/>
              <path d="M216 108C216 48.3532 264.353 0 324 0C383.647 0 432 48.3532 432 108C432 167.647 383.647 216 324 216H216V108Z" fill="currentColor"/>
              <path d="M432 0H540C599.647 0 648 48.3532 648 108C648 167.647 599.647 216 540 216C480.353 216 432 167.647 432 108V0Z" fill="currentColor"/>
            </svg>
            Backlog
          </Link>
          <div className="flex items-center gap-2">
            {isHomePage ? (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 transition-colors"
              >
                Admin Panel
              </Link>
            ) : isAdminPage ? (
              <>
                <Link
                  href="/admin/new"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Project
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--border-strong)] text-[var(--foreground-muted)] bg-[var(--bg-elevated)] hover:bg-[var(--border)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:ring-offset-2 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to overview
                </Link>
              </>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--border-strong)] text-[var(--foreground-muted)] bg-[var(--bg-elevated)] hover:bg-[var(--border)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:ring-offset-2 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to overview
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
