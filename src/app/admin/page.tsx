'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, LockClosedIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { SearchInput } from '@/components/SearchInput';
import { PartnerSelect } from '@/components/PartnerSelect';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsApi } from '@/hooks/useProjectsApi';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from '@/types/project';

type AdminTab = 'visible' | 'hidden';

function SortableProjectRow({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
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
      className="cursor-grab active:cursor-grabbing px-2 py-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] inline-flex"
      {...attributes}
      {...listeners}
    >
      <Bars3Icon className="h-5 w-5" aria-hidden />
    </div>
  );

  return (
    <ProjectCard
      project={project}
      variant="list"
      onDelete={onDelete}
      leadingCell={dragHandle}
      trRef={setNodeRef}
      trStyle={style}
      trClassName={`hover:bg-[var(--bg)]/60 transition-colors ${isDragging ? 'opacity-50 bg-[var(--bg)]' : ''}`}
    />
  );
}

function AdminContent() {
  const { projects, fetchProjects, deleteProject, reorderProjects, setProjects, error } = useProjectsApi();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('visible');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const searchParams = useSearchParams();
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
    tabFilter: activeTab,
  });

  const filtersActive = selectedTag !== 'All' || !!selectedPartner || !!searchQuery;
  const visibleProjects = filtersActive ? filteredProjects : projects.filter(p => !p.isPrivate);
  const hiddenProjects = filtersActive ? filteredWorkProjects : projects.filter(p => p.isPrivate);
  const projectsToShow = activeTab === 'visible' ? visibleProjects : hiddenProjects;
  const sortableIds = projectsToShow.map(p => p.id);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProjects();

    // Check for success message in localStorage
    const message = localStorage.getItem('adminSuccessMessage');
    if (message) {
      setSuccessMessage(message);
      // Clear message from localStorage
      localStorage.removeItem('adminSuccessMessage');
      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    setProjectToDelete(id);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
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
        setSuccessMessage('Failed to save order. Please try again.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    },
    [projects, projectsToShow, activeTab, reorderProjects, setProjects]
  );

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const success = await deleteProject(projectToDelete);
      if (!success) throw new Error('Failed to delete project');
      setShowDeleteModal(false);
      setProjectToDelete(null);
      setSuccessMessage('Project deleted successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { setSuccessMessage(null); }, 3000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated p-8">
            <div className="text-center">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">Error loading projects</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {successMessage && (
          <div className="mb-6 p-4 bg-[var(--success-bg)] rounded-[var(--radius)] border border-green-200">
            <p className="text-sm text-[var(--success-text)]">{successMessage}</p>
          </div>
        )}

        {/* Search, filters and tabs in one block */}
        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
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

            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <TagDisplay
                  key={tag}
                  tag={tag}
                  count={getTagCount(tag)}
                  isSelected={selectedTag === tag}
                  onClick={setSelectedTag}
                  variant="filter"
                />
              ))}
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

          {/* Tabs - Verborgen only when logged in */}
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
              <span className="text-xs opacity-75">({visibleProjects.length})</span>
            </button>
            {isAuthenticated && (
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
                <span className="text-xs opacity-75">({hiddenProjects.length})</span>
              </button>
            )}
          </div>
        </div>

        {filtersActive && (
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Wis filters om projecten te herordenen.
          </p>
        )}

        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  <thead className="bg-[var(--bg)]">
                    <tr>
                      {!filtersActive && (
                        <th scope="col" className="w-10 px-2 py-3" aria-label="Reorder" />
                      )}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                        URL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                        Tags
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                        Partner
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                        Completion Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--bg-elevated)] divide-y divide-[var(--border)]">
                    {projectsToShow.map((project) =>
                      filtersActive ? (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          variant="list"
                          onDelete={handleDelete}
                        />
                      ) : (
                        <SortableProjectRow
                          key={project.id}
                          project={project}
                          onDelete={handleDelete}
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated-hover max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">Delete Project</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {deleteError ? (
              <div className="mb-4 p-3 bg-[var(--error-bg)] border border-red-200 rounded-[var(--radius)]">
                <p className="text-sm text-[var(--error-text)]">{deleteError}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)] mb-6">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-strong)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-[var(--radius)] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
} 