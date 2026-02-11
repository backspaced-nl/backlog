'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { SearchInput } from '@/components/SearchInput';
import { PartnerSelect } from '@/components/PartnerSelect';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsApi } from '@/hooks/useProjectsApi';

function AdminContent() {
  const { projects, fetchProjects, deleteProject, error } = useProjectsApi();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const {
    filteredProjects,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedPartner,
    setSelectedPartner,
    allTags,
    allPartners,
    getTagCount
  } = useProjectFilters({ projects });

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

        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated p-6 mb-8">
          {/* Search and Partner Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects..."
            />
            <PartnerSelect
              value={selectedPartner}
              onChange={setSelectedPartner}
              partners={allPartners}
            />
          </div>

          {/* Tag Filter */}
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
              {(selectedPartner || selectedTag !== 'All') && (
                <button
                  onClick={() => {
                    setSelectedTag('All');
                    setSelectedPartner('');
                  }}
                  className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="bg-[var(--bg)]">
                <tr>
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
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    variant="list"
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
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