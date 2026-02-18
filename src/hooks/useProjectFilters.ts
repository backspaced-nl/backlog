import { useState, useMemo } from 'react';
import { Project } from '@/types/project';

interface UseProjectFiltersProps {
  projects: Project[];
  initialTag?: string;
  initialPartner?: string;
  initialSearchQuery?: string;
  /** When set, allTags, allPartners and getTagCount only consider projects in this tab */
  tabFilter?: 'visible' | 'hidden';
}

interface UseProjectFiltersResult {
  filteredProjects: Project[];
  filteredWorkProjects: Project[];
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
  initialSearchQuery = '',
  tabFilter
}: UseProjectFiltersProps): UseProjectFiltersResult {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedPartner, setSelectedPartner] = useState(initialPartner);

  const projectsForTab = useMemo(() => {
    if (!tabFilter) return projects;
    return tabFilter === 'visible'
      ? projects.filter(p => !p.isPrivate)
      : projects.filter(p => p.isPrivate);
  }, [projects, tabFilter]);

  const allTags = useMemo(() =>
    ['All', ...new Set(projectsForTab.flatMap(project => project.tags))],
    [projectsForTab]
  );

  const allPartners = useMemo(() =>
    [...new Set(projectsForTab.map(project => project.partner).filter((partner): partner is string => Boolean(partner)))],
    [projectsForTab]
  );

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter(project => {
      if (project.isPrivate) return false;
      const matchesSearch = query === '' ||
        project.title.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (project.partner && project.partner.toLowerCase().includes(query)) ||
        project.url.toLowerCase().includes(query);
      const matchesPartner = selectedPartner === '' || project.partner === selectedPartner;
      const matchesTag = selectedTag === 'All' || project.tags.includes(selectedTag);
      return matchesSearch && matchesPartner && matchesTag;
    });
  }, [projects, searchQuery, selectedPartner, selectedTag]);

  const filteredWorkProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter(project => {
      if (!project.isPrivate) return false;
      const matchesSearch = query === '' ||
        project.title.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (project.partner && project.partner.toLowerCase().includes(query)) ||
        project.url.toLowerCase().includes(query);
      const matchesPartner = selectedPartner === '' || project.partner === selectedPartner;
      const matchesTag = selectedTag === 'All' || project.tags.includes(selectedTag);
      return matchesSearch && matchesPartner && matchesTag;
    });
  }, [projects, searchQuery, selectedPartner, selectedTag]);

  const getTagCount = (tag: string): number => {
    const base = projectsForTab;
    return tag === 'All'
      ? base.filter(project => {
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
      : base.filter(project => {
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
  };
} 