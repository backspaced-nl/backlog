'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { PencilIcon, LockClosedIcon, ArrowTopRightOnSquareIcon, UserIcon, CalendarDaysIcon, TagIcon } from '@heroicons/react/24/outline';
import type { Project } from '@/types/project';
import { TagDisplay } from './TagDisplay';

interface ProjectCardProps {
  project: Project;
  isAuthenticated?: boolean;
  variant?: 'grid' | 'list';
  onDelete?: (id: string) => void;
  index?: number;
}

export function ProjectCard({ 
  project, 
  isAuthenticated = false,
  variant = 'grid',
  onDelete,
  index = 0
}: ProjectCardProps) {
  const [egg, setEgg] = useState<'red' | 'yellow' | 'green' | null>(null);

  const fireConfetti = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({ origin: { x, y }, particleCount: 80, spread: 60 });
  }, []);

  const domain = (() => {
    try {
      return new URL(project.url).hostname;
    } catch {
      return project.url;
    }
  })();

  if (variant === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: egg === 'red' ? 0 : 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`group relative ${egg === 'red' ? 'hidden' : ''}`}
      >
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden bg-[var(--bg-elevated)] mb-5">
            {/* Fake browser chrome */}
            <div className="bg-[var(--bg-elevated)] px-4 py-2.5 flex items-center gap-2 border-b border-[var(--border)]">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEgg((c) => (c === 'red' ? null : 'red')); }}
                className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] hover:ring-2 hover:ring-[#ff5f57]/50 transition-transform hover:scale-110"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEgg((c) => (c === 'yellow' ? null : 'yellow')); }}
                className="w-2.5 h-2.5 rounded-full bg-[#febc2e] hover:ring-2 hover:ring-[#febc2e]/50 transition-transform hover:scale-110"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); fireConfetti(e); }}
                className="w-2.5 h-2.5 rounded-full bg-[#28c840] hover:ring-2 hover:ring-[#28c840]/50 transition-transform hover:scale-110"
                aria-label="Confetti"
              />
              <span className="ml-2 text-[11px] text-black/40 font-[family-name:var(--font-sans)] truncate">
                {domain}
              </span>
            </div>
            {/* Image with aspect ratio */}
            <div className="relative aspect-[1440/1920] bg-[var(--border)] overflow-hidden">
                {isAuthenticated && (
                  <Link
                    href={`/admin/edit/${project.id}`}
                    className="absolute bottom-3 right-3 z-20 p-2 bg-[var(--bg-elevated)] rounded-[var(--radius)] border border-[var(--border)] shadow-elevated opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <PencilIcon className="h-4 w-4 text-[var(--foreground-muted)] hover:text-[var(--accent)]" />
                  </Link>
                )}
                {project.screenshotUrl ? (
                  <Image
                    src={project.screenshotUrl}
                    alt={`${project.title} screenshot`}
                    fill
                    className={`object-cover transition-transform duration-300 ${egg === 'yellow' ? 'scale-y-[-1]' : ''}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    priority
                    unoptimized
                  />
                ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-500 bg-highlight text-ink px-3 py-1 rounded-[var(--radius)] inline-flex items-center gap-1.5"
              >
                <TagIcon className="w-3.5 h-3.5 shrink-0" />
                {tag}
              </span>
            ))}
            {project.partner && (
              <span className="text-xs font-500 bg-highlight text-ink px-3 py-1 rounded-[var(--radius)] inline-flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                {project.partner}
              </span>
            )}
            {project.completionDate && (
              <span className="text-xs font-500 bg-highlight text-ink px-3 py-1 rounded-[var(--radius)] inline-flex items-center gap-1.5">
                <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                {new Date(project.completionDate).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </a>
      </motion.div>
    );
  }

  return (
    <tr className="hover:bg-[var(--bg)]/60 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-[var(--foreground)]">{project.title}</div>
        {project.screenshotLocked && (
          <div className="mt-1 flex items-center text-xs text-[var(--foreground-muted)]">
            <LockClosedIcon className="h-3 w-3 mr-1" />
            Screenshot locked
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)]"
            title={project.url}
          >
            <span className="truncate max-w-[200px]">
              {project.url}
            </span>
            <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
          </a>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <TagDisplay key={tag} tag={tag} variant="pill" />
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-[var(--foreground-muted)]">{project.partner || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-[var(--foreground-muted)]">
          {project.completionDate ? new Date(project.completionDate).toLocaleDateString() : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/edit/${project.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-[var(--radius)] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-[var(--radius)] text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
} 