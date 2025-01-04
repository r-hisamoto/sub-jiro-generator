import { ProjectLog, ProjectComment, ProjectLogFilter } from '@/types/projectLog';

export class ProjectLogger {
  private static instance: ProjectLogger;
  private logs: Map<string, ProjectLog[]> = new Map();
  private comments: Map<string, ProjectComment[]> = new Map();

  private constructor() {}

  static getInstance(): ProjectLogger {
    if (!ProjectLogger.instance) {
      ProjectLogger.instance = new ProjectLogger();
    }
    return ProjectLogger.instance;
  }

  // ログの追加
  async addLog(log: Omit<ProjectLog, 'id' | 'createdAt'>): Promise<ProjectLog> {
    const newLog: ProjectLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    const projectLogs = this.logs.get(log.projectId) || [];
    this.logs.set(log.projectId, [newLog, ...projectLogs]);

    // TODO: データベースへの保存処理
    await this.persistLog(newLog);

    return newLog;
  }

  // コメントの追加
  async addComment(comment: Omit<ProjectComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectComment> {
    const newComment: ProjectComment = {
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const projectComments = this.comments.get(comment.projectId) || [];
    this.comments.set(comment.projectId, [newComment, ...projectComments]);

    // TODO: データベースへの保存処理
    await this.persistComment(newComment);

    return newComment;
  }

  // ログの取得（フィルタリング付き）
  async getLogs(projectId: string, filter?: ProjectLogFilter): Promise<ProjectLog[]> {
    let logs = this.logs.get(projectId) || [];

    if (filter) {
      logs = this.filterLogs(logs, filter);
    }

    return logs;
  }

  // コメントの取得
  async getComments(projectId: string): Promise<ProjectComment[]> {
    return this.comments.get(projectId) || [];
  }

  // スレッドコメントの取得
  async getThreadComments(projectId: string, parentId: string): Promise<ProjectComment[]> {
    const comments = this.comments.get(projectId) || [];
    return comments.filter(comment => comment.parentId === parentId);
  }

  // ログの永続化
  private async persistLog(log: ProjectLog): Promise<void> {
    // TODO: 実際のデータベース保存処理を実装
    console.log('ログを保存:', log);
  }

  // コメントの永続化
  private async persistComment(comment: ProjectComment): Promise<void> {
    // TODO: 実際のデータベース保存処理を実装
    console.log('コメントを保存:', comment);
  }

  // ログのフィルタリング
  private filterLogs(logs: ProjectLog[], filter: ProjectLogFilter): ProjectLog[] {
    return logs.filter(log => {
      // タイプによるフィルタリング
      if (filter.types && !filter.types.includes(log.type)) {
        return false;
      }

      // ユーザーによるフィルタリング
      if (filter.users && !filter.users.includes(log.userId)) {
        return false;
      }

      // 日付範囲によるフィルタリング
      if (filter.dateRange) {
        const logDate = new Date(log.createdAt);
        if (
          logDate < filter.dateRange.start ||
          logDate > filter.dateRange.end
        ) {
          return false;
        }
      }

      // テキスト検索
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchableText = `${log.action} ${JSON.stringify(log.details)}`.toLowerCase();
        return searchableText.includes(query);
      }

      return true;
    });
  }

  // ログの一括エクスポート
  async exportLogs(projectId: string, format: 'csv' | 'json'): Promise<string> {
    const logs = await this.getLogs(projectId);

    if (format === 'csv') {
      return this.generateCSV(logs);
    } else {
      return JSON.stringify(logs, null, 2);
    }
  }

  // CSVの生成
  private generateCSV(logs: ProjectLog[]): string {
    const headers = ['ID', '日時', 'ユーザーID', 'タイプ', 'アクション', '詳細'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.createdAt).toLocaleString(),
      log.userId,
      log.type,
      log.action,
      JSON.stringify(log.details)
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  // ログの集計
  async aggregateLogs(projectId: string, groupBy: 'type' | 'user' | 'date'): Promise<Record<string, number>> {
    const logs = await this.getLogs(projectId);
    const result: Record<string, number> = {};

    logs.forEach(log => {
      let key: string;
      switch (groupBy) {
        case 'type':
          key = log.type;
          break;
        case 'user':
          key = log.userId;
          break;
        case 'date':
          key = new Date(log.createdAt).toLocaleDateString();
          break;
      }

      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }
} 