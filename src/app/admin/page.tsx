'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Project } from '@/types/project';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { SearchInput } from '@/components/SearchInput';
import { PartnerSelect } from '@/components/PartnerSelect';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectCard } from '@/components/ProjectCard';

interface ScreenshotJob {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

function AdminContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [screenshotJob, setScreenshotJob] = useState<ScreenshotJob | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
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

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }
      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const checkForExistingJob = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/screenshots/status');
      if (response.ok) {
        const data = await response.json();
        if (data.job) {
          setScreenshotJob(data.job);
          if (data.job.status === 'pending' || data.job.status === 'processing') {
            startPolling();
          }
        }
      }
    } catch (error) {
      console.error('Error checking for existing job:', error);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    checkForExistingJob();

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

    // Cleanup interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [checkForExistingJob, pollingInterval]);

  useEffect(() => {
    if (screenshotJob?.status === 'completed' || screenshotJob?.status === 'failed') {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      // Remove the job after 3 seconds to show completion message
      setTimeout(() => {
        setScreenshotJob(null);
      }, 3000);
    }
  }, [screenshotJob?.status, pollingInterval]);

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/screenshots/status');
        if (response.ok) {
          const data = await response.json();
          setScreenshotJob(data.job);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);
    setPollingInterval(interval);
  };

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
      const response = await fetch(`/api/projects`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: projectToDelete }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      setProjects(projects.filter(project => project.id !== projectToDelete));
      setShowDeleteModal(false);
      setProjectToDelete(null);
      setSuccessMessage('Project deleted successfully');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Error loading projects</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={loadProjects}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {screenshotJob && (
          <div className={`mb-6 p-4 rounded-lg border ${
            screenshotJob.status === 'failed' ? 'bg-red-50 border-red-200' :
            screenshotJob.status === 'completed' ? 'bg-green-50 border-green-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm ${
              screenshotJob.status === 'failed' ? 'text-red-800' :
              screenshotJob.status === 'completed' ? 'text-green-800' :
              'text-blue-800'
            }`}>
              {screenshotJob.status === 'pending' && 'Starting screenshot generation...'}
              {screenshotJob.status === 'processing' && 'Generating screenshots...'}
              {screenshotJob.status === 'completed' && 'Screenshots generated successfully!'}
              {screenshotJob.status === 'failed' && `Screenshot generation failed: ${screenshotJob.message}`}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
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
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedTag}
                  <button
                    onClick={() => setSelectedTag('All')}
                    className="ml-1.5 text-indigo-400 hover:text-indigo-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedPartner && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedPartner}
                  <button
                    onClick={() => setSelectedPartner('')}
                    className="ml-1.5 text-indigo-400 hover:text-indigo-600"
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
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
        <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {deleteError ? (
              <div className="mb-4 p-3 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600/90 backdrop-blur-sm border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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