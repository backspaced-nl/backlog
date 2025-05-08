export interface Project {
  id: string;
  title: string;
  tags: string[];
  completionDate?: string;
  partner?: string;
  url: string;
  screenshotLocked?: boolean;
  screenshotError?: string | null;
  updatedAt?: string;
  createdAt?: string;
} 