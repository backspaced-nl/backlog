'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/hooks/useAuth';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { SearchInput } from '@/components/SearchInput';
import { PartnerSelect } from '@/components/PartnerSelect';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsApi } from '@/hooks/useProjectsApi';
import { Bars3Icon, ExclamationCircleIcon, LockClosedIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import type { Project } from '@/types/project';

type FrontendTab = 'visible' | 'hidden';

function SortableProjectCard({
  project,
  isAuthenticated,
  index,
}: {
  project: Project;
  isAuthenticated: boolean;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <div
      className="cursor-grab active:cursor-grabbing pl-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      {...attributes}
      {...listeners}
    >
      <Bars3Icon className="h-4 w-4" aria-hidden />
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50 z-10' : ''}>
      <ProjectCard
        project={project}
        isAuthenticated={isAuthenticated}
        index={index}
        dragHandle={dragHandle}
      />
    </div>
  );
}

export default function Home() {
  const { projects, fetchProjects, reorderProjects, setProjects, loading, error } = useProjectsApi();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab: FrontendTab = pathname === '/verborgen' ? 'hidden' : 'visible';

  const setActiveTab = useCallback((tab: FrontendTab) => {
    router.push(tab === 'hidden' ? '/verborgen' : '/');
  }, [router]);
  
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
    if (!authLoading && !isAuthenticated && activeTab === 'hidden') setActiveTab('visible');
  }, [authLoading, isAuthenticated, activeTab, setActiveTab]);

  useEffect(() => {
    if (!loading && activeTab === 'hidden' && filteredWorkProjects.length === 0) setActiveTab('visible');
  }, [loading, activeTab, filteredWorkProjects.length, setActiveTab]);

  const projectsToShow = activeTab === 'visible' ? filteredProjects : filteredWorkProjects;
  const filtersActive = selectedTag !== 'All' || !!selectedPartner || !!searchQuery;
  const canReorder = isAuthenticated && !filtersActive;
  const hasFilters = allTags.length > 1 || allPartners.length > 0;
  const hasTabs = isAuthenticated && filteredWorkProjects.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [justDragged, setJustDragged] = useState(false);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setJustDragged(true);
      if (!over || active.id === over.id) return;

      const oldList = projectsToShow.map(p => p.id);
      const oldIndex = oldList.indexOf(active.id as string);
      const newIndex = oldList.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedList = arrayMove(oldList, oldIndex, newIndex);
      const visibleIds = projects.filter(p => !p.isPrivate).map(p => p.id);
      const hiddenIds = projects.filter(p => p.isPrivate).map(p => p.id);
      const newOrder = activeTab === 'visible'
        ? [...reorderedList, ...hiddenIds]
        : [...visibleIds, ...reorderedList];

      const previousProjects = [...projects];
      setProjects(
        newOrder
          .map(id => projects.find(p => p.id === id))
          .filter((p): p is Project => p != null)
      );

      const success = await reorderProjects(newOrder);
      if (!success) {
        setProjects(previousProjects);
      }
    },
    [projects, projectsToShow, activeTab, reorderProjects, setProjects]
  );

  return (
    <main className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 rounded-[var(--radius-lg)] p-4 bg-[var(--error-bg)] border border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[var(--error-text)]">
              <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchProjects()}
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-[var(--radius)] bg-red-600 text-white hover:bg-red-700"
            >
              Opnieuw proberen
            </button>
          </div>
        )}
        {/* Search, filters and tabs in one block */}
        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Zoek projecten..."
              />
              {allPartners.length > 0 && (
                <PartnerSelect
                  value={selectedPartner}
                  onChange={setSelectedPartner}
                  partners={allPartners}
                />
              )}
            </div>

            {hasFilters && (
            <div className="mt-4 min-h-[2.5rem]">
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  [48, 56, 64, 72, 56].map((w, i) => (
                    <div
                      key={i}
                      className="h-8 rounded-[var(--radius)] bg-[var(--highlight)] animate-pulse"
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

              {filtersActive && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                {selectedTag !== 'All' && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-[var(--accent-muted)] text-[var(--accent-foreground)] border border-[var(--accent)]">
                      {selectedTag}
                      <button
                        onClick={() => setSelectedTag('All')}
                        className="text-[var(--accent)]/70 hover:text-[var(--accent)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                {selectedPartner && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-[var(--accent-muted)] text-[var(--accent-foreground)] border border-[var(--accent)]">
                      {selectedPartner}
                      <button
                        onClick={() => setSelectedPartner('')}
                        className="text-[var(--accent)]/70 hover:text-[var(--accent)]"
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
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Wis filters
                  </button>
                </div>
              )}
            </div>
            )}

          </div>

          {/* Tabs - only when logged in and there are hidden projects */}
          {isAuthenticated && filteredWorkProjects.length > 0 && (
            <div className="flex gap-0 border-t border-[var(--border)] bg-[var(--bg)]/30">
              <button
                type="button"
                onClick={() => setActiveTab('visible')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-h-[480px]"
          onClickCapture={(e) => {
            if (justDragged) {
              e.preventDefault();
              e.stopPropagation();
              setJustDragged(false);
            }
          }}
        >
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="group relative">
                <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden bg-[var(--bg-elevated)] mb-5">
                  <div className="bg-[var(--bg-elevated)] px-4 py-2.5 flex items-center gap-2 border-b border-[var(--border)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--highlight)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--highlight)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--highlight)]" />
                    <div className="ml-2 h-3 bg-[var(--highlight)] animate-pulse rounded w-24" />
                  </div>
                  <div className="relative aspect-[1440/1920] bg-[var(--highlight)] animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 bg-[var(--highlight)] animate-pulse rounded-[var(--radius)] w-16" />
                  ))}
                </div>
              </div>
            ))
          ) : canReorder ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={projectsToShow.map(p => p.id)}
                strategy={rectSortingStrategy}
              >
                {projectsToShow.map((project, i) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    isAuthenticated={isAuthenticated}
                    index={i}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
