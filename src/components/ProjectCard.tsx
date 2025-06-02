import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { PencilIcon, LockClosedIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { Project } from '@/types/project';
import { TagDisplay } from './TagDisplay';

interface ProjectCardProps {
  project: Project;
  isAuthenticated?: boolean;
  variant?: 'grid' | 'list';
  onDelete?: (id: string) => void;
}

export function ProjectCard({ 
  project, 
  isAuthenticated = false,
  variant = 'grid',
  onDelete
}: ProjectCardProps) {
  if (variant === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300"
      >
        {isAuthenticated && (
          <Link
            href={`/admin/edit/${project.id}`}
            className="absolute top-2 right-2 z-10 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <PencilIcon className="h-4 w-4 text-gray-600 hover:text-indigo-600" />
          </Link>
        )}
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
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
            <h2 className="text-base font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
              {project.title}
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                <TagDisplay key={tag} tag={tag} />
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
        </a>
      </motion.div>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{project.title}</div>
        {project.screenshotLocked && (
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <LockClosedIcon className="h-3 w-3 mr-1" />
            Screenshot locked
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            title={project.url}
          >
            <span className="truncate max-w-[200px]">
              {project.url}
            </span>
            <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
          </a>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <TagDisplay key={tag} tag={tag} variant="pill" />
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
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/edit/${project.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
} 