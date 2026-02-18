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
import { Bars3Icon, LockClosedIcon, Squares2X2Icon, TrashIcon } from '@heroicons/react/24/outline';
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
  checkboxCell,
}: {
  project: Project;
  onDelete: (id: string) => void;
  checkboxCell?: React.ReactNode;
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
      className="cursor-grab active:cursor-grabbing p-1.5 rounded text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--highlight)]/50 inline-flex transition-colors opacity-60 group-hover:opacity-100"
      {...attributes}
      {...listeners}
      title="Sleep om te herordenen"
    >
      <Bars3Icon className="h-4 w-4" aria-hidden />
    </div>
  );

  return (
    <ProjectCard
      project={project}
      variant="list"
      onDelete={onDelete}
      checkboxCell={checkboxCell}
      actionsPrefix={dragHandle}
      trRef={setNodeRef}
      trStyle={style}
      trClassName={isDragging ? 'opacity-60 bg-[var(--highlight)] shadow-sm' : undefined}
    />
  );
}

function AdminContent() {
  const { projects, fetchProjects, deleteProjects, reorderProjects, setProjects, error } = useProjectsApi();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('visible');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  const hasFilters = allTags.length > 1 || allPartners.length > 0;
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
    if (activeTab === 'hidden' && hiddenProjects.length === 0) setActiveTab('visible');
  }, [activeTab, hiddenProjects.length]);

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

  const handleDelete = (id: string) => {
    setIdsToDelete([id]);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIdsToDelete(Array.from(selectedIds));
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === projectsToShow.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projectsToShow.map(p => p.id)));
    }
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
        setSuccessMessage('Volgorde opslaan mislukt. Probeer opnieuw.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    },
    [projects, projectsToShow, activeTab, reorderProjects, setProjects]
  );

  const confirmDelete = async () => {
    if (idsToDelete.length === 0) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const success = await deleteProjects(idsToDelete);
      if (!success) throw new Error('Failed to delete projects');
      setShowDeleteModal(false);
      setIdsToDelete([]);
      setSelectedIds(prev => {
        const next = new Set(prev);
        idsToDelete.forEach(id => next.delete(id));
        return next;
      });
      setSuccessMessage(idsToDelete.length === 1 ? 'Project verwijderd' : `${idsToDelete.length} projecten verwijderd`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { setSuccessMessage(null); }, 3000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
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
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">Fout bij laden projecten</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius)] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
              >
                Opnieuw proberen
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
          <div className="mb-6 p-4 bg-[var(--success-bg)] rounded-[var(--radius-lg)] border border-green-200">
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
              {allPartners.length > 0 && (
                <PartnerSelect
                  value={selectedPartner}
                  onChange={setSelectedPartner}
                  partners={allPartners}
                />
              )}
            </div>

            {hasFilters && (
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
            )}

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

          {/* Tabs - only when there are hidden projects */}
          {hiddenProjects.length > 0 && (
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
                <span className="text-xs opacity-75">({visibleProjects.length})</span>
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
                <span className="text-xs opacity-75">({hiddenProjects.length})</span>
              </button>
            </div>
          )}
        </div>

        {filtersActive && (
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Wis filters om projecten te herordenen.
          </p>
        )}

        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-4 p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated">
            <span className="text-sm font-medium text-[var(--accent-foreground)]">
              {selectedIds.size} geselecteerd
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Selectie annuleren
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-[var(--radius)] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4" />
              Verwijder geselecteerd
            </button>
          </div>
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
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg)]/70">
                      {isAuthenticated && (
                        <th scope="col" className="w-12 pl-4 py-3.5">
                          <div className="flex items-center justify-center w-5 h-5">
                            <input
                              type="checkbox"
                              checked={projectsToShow.length > 0 && selectedIds.size === projectsToShow.length}
                              onChange={toggleSelectAll}
                              aria-label="Selecteer alle"
                              className="checkbox-custom"
                            />
                          </div>
                        </th>
                      )}
                      <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">
                        Titel
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">
                        URL
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">
                        Tags
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">
                        Partner
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">
                        Datum
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--bg-elevated)]">
                    {projectsToShow.map((project) => {
                      const checkbox = isAuthenticated ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(project.id)}
                          onChange={() => toggleSelection(project.id)}
                          aria-label={`Selecteer ${project.title}`}
                          className="checkbox-custom"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : null;
                      return filtersActive ? (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          variant="list"
                          onDelete={handleDelete}
                          checkboxCell={checkbox}
                        />
                      ) : (
                        <SortableProjectRow
                          key={project.id}
                          project={project}
                          onDelete={handleDelete}
                          checkboxCell={checkbox}
                        />
                      );
                    })}
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
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
                {idsToDelete.length === 1 ? 'Project verwijderen' : `${idsToDelete.length} projecten verwijderen`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setIdsToDelete([]);
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
                {idsToDelete.length === 1
                  ? 'Weet je zeker dat je dit project wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'
                  : `Weet je zeker dat je ${idsToDelete.length} projecten wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setIdsToDelete([]);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-strong)]"
              >
                Annuleren
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
                  'Verwijderen'
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
    <Suspense fallback={<div>Laden...</div>}>
      <AdminContent />
    </Suspense>
  );
} 