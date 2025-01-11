import { User } from './team';

export interface ProjectLog {
  id: string;
  projectId: string;
  userId: string;
  type: 'edit' | 'comment' | 'status' | 'member' | 'setting';
  action: string;
  details: {
    before?: any;
    after?: any;
    comment?: string;
    changes?: Record<string, any>;
  };
  createdAt: Date;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  parentId?: string;
  mentions: string[];
  attachments: {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectLogFilter {
  types?: ProjectLog['type'][];
  users?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
} 