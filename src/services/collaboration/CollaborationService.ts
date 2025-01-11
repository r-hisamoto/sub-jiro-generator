import { PerformanceService } from '@/services/performance/PerformanceService';

export interface Team {
  id?: string;
  name: string;
  description: string;
  members: string[];
}

export interface Invitee {
  email: string;
  role: string;
}

export interface TeamSettings {
  name: string;
  description: string;
  visibility: string;
}

export interface MemberPermissions {
  canEdit: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

export interface EditChange {
  type: string;
  position: number;
  content: string;
}

export interface EditHistoryEntry {
  version: number;
  author: string;
  timestamp: Date;
  changes: EditChange[];
}

export interface Comment {
  content: string;
  position: {
    line: number;
    column: number;
  };
}

export interface Notification {
  type: string;
  documentId: string;
  message: string;
}

export class CollaborationService {
  private teams: Map<string, Team> = new Map();
  private editHistory: Map<string, EditHistoryEntry[]> = new Map();

  constructor(private performanceService: PerformanceService) {}

  async createTeam(team: Team): Promise<Team> {
    this.performanceService.startMeasurement('createTeam');

    const id = crypto.randomUUID();
    const newTeam = { ...team, id };
    this.teams.set(id, newTeam);

    this.performanceService.endMeasurement('createTeam');

    return newTeam;
  }

  async inviteMember(teamId: string, invitee: Invitee): Promise<{ inviteId: string; status: string }> {
    this.performanceService.startMeasurement('inviteMember');

    if (!this.teams.has(teamId)) {
      throw new Error('Team not found');
    }

    const inviteId = crypto.randomUUID();

    this.performanceService.endMeasurement('inviteMember');

    return { inviteId, status: 'pending' };
  }

  async updateTeamSettings(teamId: string, settings: TeamSettings): Promise<TeamSettings> {
    this.performanceService.startMeasurement('updateTeamSettings');

    if (!this.teams.has(teamId)) {
      throw new Error('Team not found');
    }

    const team = this.teams.get(teamId)!;
    const updatedTeam = { ...team, ...settings };
    this.teams.set(teamId, updatedTeam);

    this.performanceService.endMeasurement('updateTeamSettings');

    return settings;
  }

  async updateMemberPermissions(
    teamId: string,
    memberId: string,
    permissions: MemberPermissions
  ): Promise<{ memberId: string; permissions: MemberPermissions }> {
    this.performanceService.startMeasurement('updateMemberPermissions');

    if (!this.teams.has(teamId)) {
      throw new Error('Team not found');
    }

    this.performanceService.endMeasurement('updateMemberPermissions');

    return { memberId, permissions };
  }

  async syncEdit(documentId: string, change: EditChange): Promise<{
    version: number;
    changes: EditChange[];
    timestamp: Date;
  }> {
    this.performanceService.startMeasurement('syncEdit');

    const history = this.editHistory.get(documentId) || [];
    const version = history.length + 1;
    const entry: EditHistoryEntry = {
      version,
      author: 'current-user',
      timestamp: new Date(),
      changes: [change]
    };
    history.push(entry);
    this.editHistory.set(documentId, history);

    this.performanceService.endMeasurement('syncEdit');

    return {
      version,
      changes: [change],
      timestamp: entry.timestamp
    };
  }

  async getEditHistory(documentId: string): Promise<EditHistoryEntry[]> {
    this.performanceService.startMeasurement('getEditHistory');

    const history = this.editHistory.get(documentId) || [];

    this.performanceService.endMeasurement('getEditHistory');

    return history;
  }

  async addComment(documentId: string, comment: Comment): Promise<{
    id: string;
    author: string;
    content: string;
    position: { line: number; column: number };
  }> {
    this.performanceService.startMeasurement('addComment');

    const id = crypto.randomUUID();

    this.performanceService.endMeasurement('addComment');

    return {
      id,
      author: 'current-user',
      content: comment.content,
      position: comment.position
    };
  }

  async sendNotification(teamId: string, notification: Notification): Promise<{
    id: string;
    timestamp: Date;
    status: string;
  }> {
    this.performanceService.startMeasurement('sendNotification');

    if (!this.teams.has(teamId)) {
      throw new Error('Team not found');
    }

    const id = crypto.randomUUID();

    this.performanceService.endMeasurement('sendNotification');

    return {
      id,
      timestamp: new Date(),
      status: 'sent'
    };
  }

  async resolveConflict(documentId: string, changes: EditChange[]): Promise<{
    resolved: boolean;
    finalContent: string;
  }> {
    this.performanceService.startMeasurement('resolveConflict');

    // 競合解決のロジックをここに実装
    // 実際の運用時は、Operational Transformationなどのアルゴリズムを使用
    const finalContent = changes.map(change => change.content).join('');

    this.performanceService.endMeasurement('resolveConflict');

    return {
      resolved: true,
      finalContent
    };
  }

  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    this.performanceService.startMeasurement('getTeamSettings');

    if (!this.teams.has(teamId)) {
      throw new Error('Team not found');
    }

    const team = this.teams.get(teamId)!;

    this.performanceService.endMeasurement('getTeamSettings');

    return {
      name: team.name,
      description: team.description,
      visibility: 'private' // デフォルト値
    };
  }
} 