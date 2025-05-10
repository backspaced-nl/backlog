'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface Project {
  id: string;
  title: string;
  tags: string[];
  completionDate: string;
  partner?: string;
  url: string;
  screenshotLocked: boolean;
  screenshotError?: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project>({
    id: '',
    title: '',
    tags: [],
    completionDate: '',
    url: '',
    screenshotLocked: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [existingPartners, setExistingPartners] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageKey, setImageKey] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to load project');
        }
        
        const data = await response.json();
        const foundProject = data.projects.find((p: Project) => p.id === params.id);
        
        if (!foundProject) {
          throw new Error('Project not found');
        }
        
        setProject(foundProject);

        // Get all existing tags and partners from all projects
        const allTags = new Set<string>();
        const allPartners = new Set<string>();
        data.projects.forEach((p: Project) => {
          p.tags.forEach(tag => allTags.add(tag));
          if (p.partner) allPartners.add(p.partner);
        });
        setExistingTags(Array.from(allTags));
        setExistingPartners(Array.from(allPartners));

        // Check for success message in localStorage
        const successMessage = localStorage.getItem('adminSuccessMessage');
        if (successMessage) {
          setMessage(successMessage);
          // Clear message from localStorage
          localStorage.removeItem('adminSuccessMessage');
          // Clear message after 3 seconds
          setTimeout(() => {
            setMessage('');
          }, 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadProject();
    }
  }, [params.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: params.id,
          title: project.title,
          tags: project.tags,
          completionDate: project.completionDate,
          partner: project.partner,
          url: project.url,
          screenshotLocked: project.screenshotLocked,
          updatedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      // Store success message in localStorage
      localStorage.setItem('adminSuccessMessage', 'Project updated successfully');
      // Redirect to admin page
      router.replace('/admin');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value.trim()) {
      const filtered = existingTags.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) &&
        !project.tags.includes(tag)
      );
      setSuggestedTags(filtered);
    } else {
      // Show all available tags when input is empty
      setSuggestedTags(existingTags.filter(tag => !project.tags.includes(tag)));
    }
  };

  const handleTagFocus = () => {
    // Show all available tags when input is focused
    setSuggestedTags(existingTags.filter(tag => !project.tags.includes(tag)));
  };

  const addTag = (tag: string) => {
    if (!project.tags.includes(tag)) {
      setProject(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput('');
    setSuggestedTags([]);
  };

  const removeTag = (tagToRemove: string) => {
    setProject(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const handlePartnerChange = (value: string) => {
    setProject({ ...project, partner: value });
    
    if (value.length > 0) {
      const filtered = existingPartners.filter(partner =>
        partner.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      // Show all available partners when input is empty
      setSuggestions(existingPartners);
      setShowSuggestions(true);
    }
  };

  const handlePartnerFocus = () => {
    // Show all available partners when input is focused
    setSuggestions(existingPartners);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (partner: string) => {
    setProject({ ...project, partner });
    setShowSuggestions(false);
  };

  const generateScreenshot = async () => {
    try {
      setIsGeneratingScreenshot(true);
      setScreenshotError(null);

      const response = await fetch('/api/screenshots/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId: project.id,
          url: project.url
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate screenshot');
      }

      // Wait a moment to ensure the file is written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message and force image reload
      setMessage('Screenshot generated successfully!');
      setImageKey(prev => prev + 1); // Force image component to remount
      setScreenshotError(null);
    } catch (err) {
      setScreenshotError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingScreenshot(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      setUploadError('File size must be less than 1MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', project.id);

      const response = await fetch('/api/screenshots/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot');
      }

      setMessage('Screenshot uploaded successfully!');
      // Force a refresh of the image by incrementing the version
      setImageKey(prev => prev + 1);
      window.scrollTo(0, 0);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/projects`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: project.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      // Store success message in localStorage
      localStorage.setItem('adminSuccessMessage', 'Project deleted successfully');
      // Redirect to admin page
      router.replace('/admin');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
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

  // Only show error view for critical errors (loading project)
  if (error && !screenshotError) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Error loading project</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold ml-4">Edit Project</h1>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="space-y-6 col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={project.title}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsFetchingTitle(true);
                          const response = await fetch('/api/admin/fetch-title', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ url: project.url }),
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to fetch title');
                          }
                          
                          const data = await response.json();
                          setProject(prev => ({ ...prev, title: data.title }));
                        } catch (err) {
                          console.error('Failed to fetch title:', err);
                        } finally {
                          setIsFetchingTitle(false);
                        }
                      }}
                      disabled={isFetchingTitle}
                      className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fetch title from website"
                    >
                      {isFetchingTitle ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="partner" className="block text-sm font-medium text-gray-700">
                    Partner (optional)
                  </label>
                  <input
                    type="text"
                    id="partner"
                    name="partner"
                    value={project.partner || ''}
                    onChange={(e) => handlePartnerChange(e.target.value)}
                    onFocus={handlePartnerFocus}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter partner name (optional)"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto"
                    >
                      {suggestions.map((partner) => (
                        <div
                          key={partner}
                          className="px-4 py-2 hover:bg-indigo-100 cursor-pointer"
                          onClick={() => handleSuggestionClick(partner)}
                        >
                          {partner}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={project.url}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700">
                    Completion Date (optional)
                  </label>
                  <input
                    type="date"
                    id="completionDate"
                    name="completionDate"
                    value={project.completionDate}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 whitespace-nowrap"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="tags"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onFocus={handleTagFocus}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add tags..."
                        className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {suggestedTags.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
                          {suggestedTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProject(prev => ({ ...prev, screenshotLocked: !prev.screenshotLocked }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      project.screenshotLocked ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        project.screenshotLocked ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    Lock Screenshot
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteError(null);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Project
                  </button>
                  <div className="flex gap-3">
                    <Link
                      href="/admin"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="col-span-1  space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Screenshot</h3>
              </div>

              <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  key={imageKey}
                  src={`/screenshots/${project.id}.jpg?t=${Date.now()}`}
                  alt={`${project.title} screenshot`}
                  fill
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  priority
                  unoptimized
                />
              </div>

              {screenshotError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Screenshot generation failed: {screenshotError}
                  </p>
                </div>
              )}

              {!project.screenshotLocked && (
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Generate screenshot</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Let our system capture a screenshot of your project&apos;s URL automatically
                    </p>
                    <button
                      type="button"
                      onClick={generateScreenshot}
                      disabled={isGeneratingScreenshot}
                      className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingScreenshot ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating...</span>
                        </>
                      ) : (
                        'Generate screenshot'
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-sm text-gray-500">or</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Upload your own screenshot</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Recommended dimensions: 1440x2000 pixels
                    </p>
                    {uploadError && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600">{uploadError}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="screenshot-upload"
                        className="w-full flex flex-col items-center justify-center px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-10 h-10 mb-3 text-indigo-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-1 text-sm text-gray-700">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">Accepted formats: PNG, JPG, JPEG</p>
                          <p className="text-xs text-gray-500">Maximum size: 1MB</p>
                        </div>
                        <input
                          id="screenshot-upload"
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/png, image/jpeg, image/jpg"
                          size={1048576}
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                onClick={handleDelete}
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