'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useProjectsApi } from '@/hooks/useProjectsApi';

export default function NewProjectPage() {
  const { createProject } = useProjectsApi();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const project = await createProject({ url });
      if (!project) throw new Error('Failed to create project');
      router.replace(`/admin/edit/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--foreground)] mb-4">New Project</h1>

        {message && (
          <div className="mb-4 p-4 bg-[var(--success-bg)] border border-green-200 rounded-[var(--radius)]">
            <p className="text-sm text-[var(--success-text)]">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-[var(--error-bg)] border border-red-200 rounded-[var(--radius)]">
            <p className="text-sm text-[var(--error-text)]">{error}</p>
          </div>
        )}

        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-[var(--foreground)]">
                Project URL
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm bg-[var(--bg-elevated)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Enter the URL of your project. We&apos;ll automatically fetch the title and generate a screenshot.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--border-strong)] text-[var(--foreground)] bg-[var(--bg-elevated)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-strong)]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
