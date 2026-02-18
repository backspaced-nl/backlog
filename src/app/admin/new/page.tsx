'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectsApi } from '@/hooks/useProjectsApi';

const STEPS = [
  'Website openen...',
  'Pagina analyseren...',
  'Screenshot maken...',
  'Afbeelding verwerken...',
  'Project opslaan...',
];
const INTERVAL_MS = 2000;
const SAVE_DISPLAY_MS = 600;

function parseUrls(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line.startsWith('http://') || line.startsWith('https://'));
}

export default function NewProjectPage() {
  const { createProject } = useProjectsApi();
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStepInterval = () => {
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    stepIntervalRef.current = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, INTERVAL_MS);
  };

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);
    startStepInterval();
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(null);
    setError(null);
    setMessage(null);

    try {
      const project = await createProject({ url, isPrivate });
      if (!project) throw new Error('Failed to create project');
      router.replace(`/admin/edit/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = parseUrls(bulkUrls);
    if (urls.length === 0) {
      setError('Voer minimaal één geldige URL in (http:// of https://)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    const failed: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      setProgress({ done: i + 1, total: urls.length });
      await new Promise((r) => setTimeout(r, 0));
      setLoadingStep(0);
      startStepInterval();
      const project = await createProject({ url: urls[i], isPrivate });
      if (!project) failed.push(urls[i]);
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setLoadingStep(STEPS.length - 1);
      await new Promise((r) => setTimeout(r, SAVE_DISPLAY_MS));
    }

    setIsLoading(false);
    setProgress(null);

    const successCount = urls.length - failed.length;
    if (successCount > 0) {
      router.push('/admin');
    }
    if (failed.length > 0 && successCount === 0) {
      setError(`Alle ${urls.length} URLs zijn gefaald.`);
    } else if (failed.length > 0) {
      setError(`Gefaald: ${failed.join(', ')}`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--foreground)] mb-4">New Project</h1>

        {message && (
          <div className="mb-4 p-4 bg-[var(--success-bg)] border border-green-200 rounded-[var(--radius)]">
            <p className="text-sm text-[var(--success-text)]">{message}</p>
            <Link href="/admin" className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
              Naar overzicht
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-[var(--error-bg)] border border-red-200 rounded-[var(--radius)]">
            <p className="text-sm text-[var(--error-text)]">{error}</p>
          </div>
        )}

        <div className="relative bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[var(--bg-elevated)]/95 backdrop-blur-sm rounded-[var(--radius-lg)]"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <svg className="animate-spin h-10 w-10 text-[var(--accent)] shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </motion.div>
                <div className="flex flex-col items-center gap-1">
                  {progress && (
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Website {progress.done} van {progress.total}
                    </p>
                  )}
                  <div className="h-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingStep}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="text-sm text-[var(--foreground)]"
                      >
                        {STEPS[loadingStep]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={mode === 'single' ? handleSubmit : handleBulkSubmit} className="p-6">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius)] transition-colors ${
                  mode === 'single'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border-strong)]'
                }`}
              >
                Enkele URL
              </button>
              <button
                type="button"
                onClick={() => setMode('bulk')}
                className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius)] transition-colors ${
                  mode === 'bulk'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border-strong)]'
                }`}
              >
                Meerdere URLs
              </button>
            </div>

            {mode === 'single' ? (
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
            ) : (
              <div>
                <label htmlFor="bulk-urls" className="block text-sm font-medium text-[var(--foreground)]">
                  URLs (één per regel)
                </label>
                <div className="mt-1">
                  <textarea
                    id="bulk-urls"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    rows={8}
                    className="block w-full px-3 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm bg-[var(--bg-elevated)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] font-mono"
                    placeholder={'https://example.com\nhttps://another-site.com\nhttps://...'}
                  />
                </div>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Plak meerdere URLs, één per regel. Alleen regels die beginnen met http:// of https:// worden verwerkt.
                </p>
              </div>
            )}

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
                {isLoading
                  ? mode === 'bulk'
                    ? 'Toevoegen...'
                    : 'Creating...'
                  : mode === 'bulk'
                    ? 'Projecten toevoegen'
                    : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
