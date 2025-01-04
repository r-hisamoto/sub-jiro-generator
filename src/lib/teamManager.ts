import { Team, User, Permission, TeamInvitation, TeamActivity } from '@/types/team';

// チームメンバーのロールに基づく権限を取得
export function getPermissions(role: User['role']): Permission {
  switch (role) {
    case 'owner':
      return {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManagePermissions: true
      };
    case 'editor':
      return {
        canEdit: true,
        canDelete: false,
        canInvite: true,
        canManagePermissions: false
      };
    case 'viewer':
      return {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false
      };
    default:
      return {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false
      };
  }
}

// チームメンバーの招待メールを送信
export async function sendInvitation(invitation: TeamInvitation): Promise<void> {
  // TODO: 実際のメール送信処理を実装
  console.log('招待メールを送信:', invitation);
}

// チーム活動ログを記録
export async function logTeamActivity(activity: TeamActivity): Promise<void> {
  // TODO: 実際のログ記録処理を実装
  console.log('チーム活動を記録:', activity);
}

// チームメンバーの権限を確認
export function checkPermission(
  user: User,
  team: Team,
  requiredPermission: keyof Permission
): boolean {
  const member = team.members.find(m => m.id === user.id);
  if (!member) return false;

  const permissions = getPermissions(member.role);
  return permissions[requiredPermission];
}

// 変更の競合をチェック
export function checkConflicts(
  changes: Partial<any>,
  lastSyncTime: Date,
  currentVersion: any
): boolean {
  return currentVersion.updatedAt > lastSyncTime;
}

// リアルタイム同期用のWebSocket接続を管理
export class TeamSyncManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private teamId: string, private userId: string) {}

  connect(): void {
    this.socket = new WebSocket(`ws://your-server/team/${this.teamId}`);
    
    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.socket?.send(JSON.stringify({
        type: 'join',
        teamId: this.teamId,
        userId: this.userId
      }));
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const listeners = this.listeners.get(data.type);
      listeners?.forEach(listener => listener(data));
    };

    this.socket.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };
  }

  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  sendUpdate(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type,
        teamId: this.teamId,
        userId: this.userId,
        data
      }));
    }
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.listeners.clear();
  }
}

// 変更履歴を管理
export class ChangeHistory {
  private history: TeamActivity[] = [];
  private maxHistorySize = 100;

  addChange(activity: TeamActivity): void {
    this.history.unshift(activity);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
  }

  getHistory(): TeamActivity[] {
    return [...this.history];
  }

  undo(): TeamActivity | undefined {
    return this.history.shift();
  }

  clear(): void {
    this.history = [];
  }
} 