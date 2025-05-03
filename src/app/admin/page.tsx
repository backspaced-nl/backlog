'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  tags: string[];
  completionDate: string;
  partner?: string;
  url: string;
  screenshotLocked: boolean;
  updatedAt: string;
}

interface ScreenshotJob {
  id: string;
  progress: number;
  total: number;
  status: string;
  startTime?: number;
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenshotJob, setScreenshotJob] = useState<ScreenshotJob | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Get all unique tags and partners
  const allTags = ['All', ...new Set(projects.flatMap(project => project.tags))];
  const allPartners = [...new Set(projects.map(project => project.partner).filter(Boolean))];

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
    loadProjects();
    checkForExistingJob();

    // Cleanup interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(project => {
      // Search query filter
      const matchesSearch = 
        project.title.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (project.partner && project.partner.toLowerCase().includes(query));
      
      // Partner filter
      const matchesPartner = !selectedPartner || project.partner === selectedPartner;
      
      // Tag filter
      const matchesTag = selectedTag === 'All' || project.tags.includes(selectedTag);
      
      return matchesSearch && matchesPartner && matchesTag;
    });
    setFilteredProjects(filtered);
  }, [searchQuery, selectedPartner, selectedTag, projects]);

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

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }
      const data = await response.json();
      setProjects(data.projects);
      setFilteredProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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

  const checkForExistingJob = async () => {
    try {
      const response = await fetch('/api/screenshots/status?jobId=all');
      if (response.ok) {
        const statusData = await response.json();
        if (statusData) {
          // Only show the job if it's still in progress
          if (statusData.status === 'pending' || statusData.status === 'processing') {
            setScreenshotJob({
              id: 'all',
              status: statusData.status,
              progress: statusData.progress || 0,
              total: statusData.total || projects.length,
              startTime: statusData.startTime
            });

            // Start polling for status
            const interval = setInterval(() => {
              checkJobStatus('all');
            }, 1000);
            setPollingInterval(interval);
          }
        }
      }
    } catch (err) {
      console.error('Error checking for existing jobs:', err);
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/screenshots/status?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to check job status');
      }

      const statusData = await response.json();
      
      if (!statusData) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setScreenshotJob(null);
        return;
      }

      // Update the job status and progress
      setScreenshotJob(prevJob => {
        if (!prevJob) return null;
        return {
          ...prevJob,
          status: statusData.status,
          progress: statusData.progress || 0,
          total: statusData.total || projects.length,
          startTime: statusData.startTime
        };
      });

      // Only stop polling if job is completed or failed
      if (statusData.status === 'completed' || statusData.status === 'failed') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        if (statusData.status === 'completed') {
          // Refresh the projects list
          loadProjects();
        }
      }
    } catch (error) {
      console.error('Error checking job status:', error);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setScreenshotJob(null);
    }
  };

  const generateScreenshots = async () => {
    try {
      // Count only unlocked projects
      const unlockedProjects = projects.filter(project => !project.screenshotLocked);

      if (unlockedProjects.length === 0) {
        setScreenshotJob({
          id: 'all',
          progress: 0,
          total: 0,
          status: 'no_screenshots',
          startTime: Date.now(),
        });
        // Hide the message after 3 seconds
        setTimeout(() => {
          setScreenshotJob(null);
        }, 3000);
        return;
      }

      // Initialize the job status immediately
      setScreenshotJob({
        id: 'all',
        progress: 0,
        total: unlockedProjects.length,
        status: 'starting',
        startTime: Date.now(),
      });

      const response = await fetch('/api/screenshots', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start screenshot generation');
      }

      await response.json(); // Just consume the response

      // Start polling for updates immediately
      const interval = setInterval(() => {
        checkJobStatus('all');
      }, 1000);

      setPollingInterval(interval);
    } catch (error) {
      console.error('Error generating screenshots:', error);
      setError('Failed to generate screenshots');
      setScreenshotJob(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your portfolio projects</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateScreenshots}
                disabled={!!screenshotJob}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate All Screenshots
              </button>
              <Link
                href="/admin/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add New Project
              </Link>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {screenshotJob && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Generating screenshots</h3>
                {screenshotJob.status !== 'no_screenshots' && (
                  <span className="text-sm text-gray-500">
                    {screenshotJob.progress} of {screenshotJob.total} sites
                  </span>
                )}
              </div>
              {screenshotJob.status === 'no_screenshots' ? (
                <div className="text-sm text-gray-500">
                  No screenshots to generate. All screenshots are locked.
                </div>
              ) : (
                <>
                  <div className="w-full bg-indigo-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(screenshotJob.progress / screenshotJob.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {screenshotJob.status}
                    {screenshotJob.status === 'completed' && screenshotJob.startTime && (
                      <span className="ml-2">
                        (Completed in {((Date.now() - screenshotJob.startTime) / 1000).toFixed(1)}s)
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-8">
          {/* Search and Partner Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="block w-full sm:w-48 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="">All Partners</option>
                {allPartners.map(partner => (
                  <option key={partner} value={partner}>
                    {partner}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              // Calculate count for each tag based on current filters
              const count = tag === 'All' 
                ? projects.filter(project => {
                    // For "All", only check partner and search filters
                    if (selectedPartner && project.partner !== selectedPartner) return false;
                    
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch = 
                        project.title.toLowerCase().includes(query) ||
                        project.tags.some(t => t.toLowerCase().includes(query)) ||
                        (project.partner && project.partner.toLowerCase().includes(query));
                      if (!matchesSearch) return false;
                    }
                    
                    return true;
                  }).length
                : projects.filter(project => {
                    // For other tags, check tag, partner, and search filters
                    if (!project.tags.includes(tag)) return false;
                    
                    if (selectedPartner && project.partner !== selectedPartner) return false;
                    
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch = 
                        project.title.toLowerCase().includes(query) ||
                        project.tags.some(t => t.toLowerCase().includes(query)) ||
                        (project.partner && project.partner.toLowerCase().includes(query));
                      if (!matchesSearch) return false;
                    }
                    
                    return true;
                  }).length;
              
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTag === tag) {
                      setSelectedTag('All');
                    } else {
                      setSelectedTag(tag);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{tag}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    selectedTag === tag
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filters */}
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

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      {project.screenshotLocked && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <LockClosedIcon className="h-3 w-3 mr-1" />
                          Screenshot locked
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{project.partner || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {project.completionDate ? new Date(project.completionDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Visit
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/edit/${project.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
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
                  setProjectToDelete(null);
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
                  setProjectToDelete(null);
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
    </main>
  );
} 