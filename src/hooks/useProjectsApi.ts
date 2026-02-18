import { useState, useCallback } from 'react';
import { Project } from '@/types/project';

export function useProjectsApi() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.projects);
      return data.projects as Project[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single project by id
  const fetchProjectById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();
      return data.project as Project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create project
  const createProject = useCallback(async (projectData: Partial<Project>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const data = await res.json();
      setProjects(prev => [data, ...prev]);
      return data as Project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (projectData: Partial<Project>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to update project');
      await res.json();
      setProjects(prev => prev.map(p => p.id === projectData.id ? { ...p, ...projectData } as Project : p));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reorder projects
  const reorderProjects = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/projects/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to reorder projects');
      await res.json();
      setProjects(prev => {
        const byId = new Map(prev.map(p => [p.id, p]));
        return ids.map(id => byId.get(id)).filter((p): p is Project => p != null);
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return false;
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete project');
      await res.json();
      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete projects
  const deleteProjects = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to delete projects');
      await res.json();
      const idSet = new Set(ids);
      setProjects(prev => prev.filter(p => !idSet.has(p.id)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    deleteProjects,
    reorderProjects,
    setProjects, // for manual updates if needed
  };
} 