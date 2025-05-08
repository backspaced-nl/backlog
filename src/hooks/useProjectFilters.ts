import { useState, useMemo } from 'react';
import { Project } from '@/types/project';

interface UseProjectFiltersProps {
  projects: Project[];
  initialTag?: string;
  initialPartner?: string;
  initialSearchQuery?: string;
}

interface UseProjectFiltersResult {
  filteredProjects: Project[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  selectedPartner: string;
  setSelectedPartner: (partner: string) => void;
  allTags: string[];
  allPartners: string[];
  getTagCount: (tag: string) => number;
}

export function useProjectFilters({
  projects,
  initialTag = 'All',
  initialPartner = '',
  initialSearchQuery = ''
}: UseProjectFiltersProps): UseProjectFiltersResult {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedPartner, setSelectedPartner] = useState(initialPartner);

  // Memoize derived values
  const allTags = useMemo(() => 
    ['All', ...new Set(projects.flatMap(project => project.tags))],
    [projects]
  );

  const allPartners = useMemo(() => 
    [...new Set(projects.map(project => project.partner).filter((partner): partner is string => Boolean(partner)))],
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter(project => {
      // Search query filter
      const matchesSearch = query === '' || 
        project.title.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (project.partner && project.partner.toLowerCase().includes(query)) ||
        project.url.toLowerCase().includes(query);
      
      // Partner filter
      const matchesPartner = selectedPartner === '' || project.partner === selectedPartner;
      
      // Tag filter
      const matchesTag = selectedTag === 'All' || project.tags.includes(selectedTag);
      
      return matchesSearch && matchesPartner && matchesTag;
    });
  }, [projects, searchQuery, selectedPartner, selectedTag]);

  const getTagCount = (tag: string): number => {
    return tag === 'All'
      ? projects.filter(project => {
          if (selectedPartner && project.partner !== selectedPartner) return false;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return project.title.toLowerCase().includes(query) ||
              project.tags.some(t => t.toLowerCase().includes(query)) ||
              (project.partner && project.partner.toLowerCase().includes(query)) ||
              project.url.toLowerCase().includes(query);
          }
          return true;
        }).length
      : projects.filter(project => {
          if (!project.tags.includes(tag)) return false;
          if (selectedPartner && project.partner !== selectedPartner) return false;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return project.title.toLowerCase().includes(query) ||
              project.tags.some(t => t.toLowerCase().includes(query)) ||
              (project.partner && project.partner.toLowerCase().includes(query)) ||
              project.url.toLowerCase().includes(query);
          }
          return true;
        }).length;
  };

  return {
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
  };
} 