import { Subtitle } from '@/types/subtitle';

/**
 * プロジェクトの共有設定
 */
export interface ProjectSharingSettings {
  projectId: string;
  ownerId: string;
  collaborators: CollaboratorInfo[];
  accessLevel: 'private' | 'shared' | 'public';
  lastModified: Date;
}

/**
 * コラボレーターの情報
 */
export interface CollaboratorInfo {
  userId: string;
  displayName: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  lastActive?: Date;
}

/**
 * 編集操作の種類
 */
export type EditOperation = 
  | { type: 'add'; subtitle: Subtitle }
  | { type: 'update'; id: string; changes: Partial<Subtitle> }
  | { type: 'delete'; id: string }
  | { type: 'reorder'; ids: string[] };

/**
 * 同時編集のための操作変換インターフェース
 */
export interface OperationalTransform {
  version: number;
  operation: EditOperation;
  timestamp: Date;
  userId: string;
}

/**
 * プロジェクトの共有状態を管理
 */
export class ProjectCollaboration {
  private projectId: string;
  private settings: ProjectSharingSettings;
  private operations: OperationalTransform[] = [];
  private subscribers: Set<(op: OperationalTransform) => void> = new Set();

  constructor(projectId: string, settings: ProjectSharingSettings) {
    this.projectId = projectId;
    this.settings = settings;
  }

  /**
   * 編集操作を適用
   */
  async applyOperation(operation: EditOperation): Promise<void> {
    const transform: OperationalTransform = {
      version: this.operations.length + 1,
      operation,
      timestamp: new Date(),
      userId: this.settings.ownerId // TODO: 現在のユーザーIDを取得
    };

    // 操作を記録
    this.operations.push(transform);

    // サブスクライバーに通知
    this.subscribers.forEach(subscriber => subscriber(transform));

    // TODO: サーバーに同期
    await this.syncWithServer(transform);
  }

  /**
   * 編集操作の変更を購読
   */
  subscribe(callback: (op: OperationalTransform) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * サーバーとの同期
   */
  private async syncWithServer(transform: OperationalTransform): Promise<void> {
    // TODO: WebSocketまたはHTTP経由でサーバーと同期
    console.log('Syncing with server:', transform);
  }

  /**
   * コラボレーターを追加
   */
  async addCollaborator(collaborator: CollaboratorInfo): Promise<void> {
    this.settings.collaborators.push(collaborator);
    // TODO: サーバーに共有設定を更新
  }

  /**
   * コラボレーターを削除
   */
  async removeCollaborator(userId: string): Promise<void> {
    this.settings.collaborators = this.settings.collaborators.filter(
      c => c.userId !== userId
    );
    // TODO: サーバーに共有設定を更新
  }

  /**
   * アクセスレベルを変更
   */
  async updateAccessLevel(level: 'private' | 'shared' | 'public'): Promise<void> {
    this.settings.accessLevel = level;
    // TODO: サーバーに共有設定を更新
  }

  /**
   * 現在のプロジェクト設定を取得
   */
  getSettings(): ProjectSharingSettings {
    return { ...this.settings };
  }

  /**
   * 編集履歴を取得
   */
  getHistory(): OperationalTransform[] {
    return [...this.operations];
  }
}

/**
 * プロジェクトの共有リンクを生成
 */
export const generateSharingLink = (projectId: string): string => {
  // TODO: 適切なドメインとパスを設定
  return `https://app.example.com/projects/${projectId}`;
};

/**
 * プロジェクトの共有設定を検証
 */
export const validateSharingSettings = (settings: ProjectSharingSettings): boolean => {
  return (
    settings.projectId.length > 0 &&
    settings.ownerId.length > 0 &&
    Array.isArray(settings.collaborators) &&
    ['private', 'shared', 'public'].includes(settings.accessLevel)
  );
}; 