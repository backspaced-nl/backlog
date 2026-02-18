export interface Project {
  id: string;
  title: string;
  tags: string[];
  completionDate?: string;
  partner?: string;
  url: string;
  screenshotLocked?: boolean;
  screenshotError?: string | null;
  isPrivate?: boolean;
  updatedAt?: string;
  createdAt?: string;
  screenshotUrl?: string;
  position?: number;
} 