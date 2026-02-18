'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectsApi } from '@/hooks/useProjectsApi';

const STEPS = [
  'Website openen...',
  'Pagina analyseren...',
  'Screenshot maken...',
  'Afbeelding verwerken...',
  'Project opslaan...',
];
const INTERVAL_MS = 3500;

export default function NewProjectPage() {
  const { createProject } = useProjectsApi();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);
    const id = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % STEPS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const project = await createProject({ url, isPrivate });
      if (!project) throw new Error('Failed to create project');
      router.replace(`/admin/edit/${project.id}`);
      // Keep overlay visible until navigation unmounts the page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

        <div className="relative bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[var(--bg-elevated)]/95 backdrop-blur-sm rounded-[var(--radius-lg)]">
              <svg className="animate-spin h-8 w-8 text-[var(--accent)] shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-[var(--foreground)]">{STEPS[loadingStep]}</p>
            </div>
          )}
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

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
                  isPrivate ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[var(--bg-elevated)] transition-transform ${
                    isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-[var(--foreground)]">
                Verborgen
              </span>
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
