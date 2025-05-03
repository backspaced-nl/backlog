'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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

export default function Home() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get all unique tags and partners
  const allTags = ['All', ...new Set(projects.flatMap(project => project.tags))];
  const allPartners = [...new Set(projects.map(project => project.partner).filter(Boolean))];
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to load projects');
        }
        const data = await response.json();
        setProjects(data.projects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  // Filter projects based on selected tag, partner, and search query
  const filteredProjects = projects.filter(project => {
    const matchesTag = selectedTag === 'All' || project.tags.includes(selectedTag);
    const matchesPartner = selectedPartner === '' || project.partner === selectedPartner;
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.partner && project.partner.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTag && matchesPartner && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
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
              const count = tag === 'All' 
                ? projects.filter(project => 
                    (selectedPartner === '' || project.partner === selectedPartner) &&
                    (searchQuery === '' || 
                      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (project.partner && project.partner.toLowerCase().includes(searchQuery.toLowerCase())))
                  ).length
                : projects.filter(project => 
                    project.tags.includes(tag) && 
                    (selectedPartner === '' || project.partner === selectedPartner) &&
                    (searchQuery === '' || 
                      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (project.partner && project.partner.toLowerCase().includes(searchQuery.toLowerCase())))
                  ).length;
              
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
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

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProjects.map((project) => (
            <motion.a
              key={project.id}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300"
            >
              <div className="relative w-full" style={{ paddingBottom: '133.33%' }}>
                <Image
                  src={`/screenshots/${project.id}.jpg?t=${project.updatedAt}`}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                />
              </div>
              <div className="p-6 flex flex-col h-full">
                <h2 className="text-base font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">{project.title}</h2>            

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-50 text-indigo-800 rounded-md text-xs border border-indigo-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
                    {project.completionDate && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(project.completionDate).toLocaleDateString()}
                      </span>
                    )}
                    {project.partner && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {project.partner}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </main>
  );
}
