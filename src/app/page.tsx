'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { SearchInput } from '@/components/SearchInput';
import { PartnerSelect } from '@/components/PartnerSelect';
import { TagDisplay } from '@/components/TagDisplay';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsApi } from '@/hooks/useProjectsApi';

export default function Home() {
  const { projects, fetchProjects } = useProjectsApi();
  const { isAuthenticated } = useAuth();
  
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
  
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and filter section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
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

          <div className="mt-4">
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
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
