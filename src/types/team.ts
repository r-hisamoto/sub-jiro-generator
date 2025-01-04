export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManagePermissions: boolean;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: User['role'];
  expiresAt: Date;
  createdAt: Date;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: 'edit' | 'delete' | 'create' | 'invite' | 'join' | 'leave';
  target: 'track' | 'project' | 'team' | 'permission';
  details: Record<string, any>;
  createdAt: Date;
} 