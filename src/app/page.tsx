'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { SearchInput } from '@/components/SearchInput';
import { PartnerSelect } from '@/components/PartnerSelect';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsApi } from '@/hooks/useProjectsApi';
import { LockClosedIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

type FrontendTab = 'visible' | 'hidden';

export default function Home() {
  const { projects, fetchProjects, loading } = useProjectsApi();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<FrontendTab>('visible');
  
  const {
    filteredProjects,
    filteredWorkProjects,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedPartner,
    setSelectedPartner,
    allTags,
    allPartners,
    getTagCount
  } = useProjectFilters({
    projects,
    tabFilter: isAuthenticated ? activeTab : 'visible',
  });

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (!isAuthenticated && activeTab === 'hidden') setActiveTab('visible');
  }, [isAuthenticated, activeTab]);

  const projectsToShow = activeTab === 'visible' ? filteredProjects : filteredWorkProjects;

  return (
    <main className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search, filters and tabs in one block */}
        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden mb-10">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Zoek projecten..."
              />
              <PartnerSelect
                value={selectedPartner}
                onChange={setSelectedPartner}
                partners={allPartners}
              />
            </div>

            <div className="mt-4 min-h-[2.5rem]">
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  [48, 56, 64, 72, 56].map((w, i) => (
                    <div
                      key={i}
                      className="h-8 rounded-[var(--radius)] bg-[var(--border)] animate-pulse"
                      style={{ width: w }}
                    />
                  ))
                ) : (
                  allTags.map((tag) => (
                    <TagDisplay
                      key={tag}
                      tag={tag}
                      count={getTagCount(tag)}
                      isSelected={selectedTag === tag}
                      onClick={setSelectedTag}
                      variant="filter"
                    />
                  ))
                )}
              </div>

              {(selectedPartner || selectedTag !== 'All') && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {selectedTag !== 'All' && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius)] text-sm bg-[var(--accent-muted)] text-[var(--accent-foreground)] border border-[var(--border)]">
                      {selectedTag}
                      <button
                        onClick={() => setSelectedTag('All')}
                        className="ml-1.5 text-[var(--accent)]/70 hover:text-[var(--accent)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedPartner && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius)] text-sm bg-[var(--accent-muted)] text-[var(--accent-foreground)] border border-[var(--border)]">
                      {selectedPartner}
                      <button
                        onClick={() => setSelectedPartner('')}
                        className="ml-1.5 text-[var(--accent)]/70 hover:text-[var(--accent)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTag('All');
                      setSelectedPartner('');
                    }}
                    className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
                  >
                    Wis filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs - only when logged in */}
          {isAuthenticated && (
            <div className="flex gap-0 border-t border-[var(--border)] bg-[var(--bg)]/30">
              <button
                type="button"
                onClick={() => setActiveTab('visible')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'visible'
                    ? 'bg-[var(--bg-elevated)] text-[var(--foreground)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg)]/50'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
                Zichtbaar
                <span className="text-xs opacity-75">({filteredProjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hidden')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'hidden'
                    ? 'bg-[var(--bg-elevated)] text-[var(--foreground)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg)]/50'
                }`}
              >
                <LockClosedIcon className="h-4 w-4" />
                Verborgen
                <span className="text-xs opacity-75">({filteredWorkProjects.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Projects grid - min-height prevents collapse when switching loading→content */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-h-[480px]">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="group relative">
                <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden bg-[var(--bg-elevated)] mb-5">
                  <div className="bg-[var(--bg-elevated)] px-4 py-2.5 flex items-center gap-2 border-b border-[var(--border)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                    <div className="ml-2 h-3 bg-[var(--border)] animate-pulse rounded w-24" />
                  </div>
                  <div className="relative aspect-[1440/1920] bg-[var(--border)] animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 bg-[var(--border)] animate-pulse rounded-[var(--radius)] w-16" />
                  ))}
                </div>
              </div>
            ))
          ) : (
            projectsToShow.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                isAuthenticated={isAuthenticated}
                index={i}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
