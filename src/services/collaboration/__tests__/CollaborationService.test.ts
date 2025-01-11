import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollaborationService } from '../CollaborationService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('CollaborationService', () => {
  let collaborationService: CollaborationService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    collaborationService = new CollaborationService(mockPerformanceService);
  });

  it('チームを作成できる', async () => {
    const team = {
      name: 'Test Team',
      description: 'Test team description',
      members: ['user1', 'user2']
    };
    
    const result = await collaborationService.createTeam(team);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', team.name);
    expect(result).toHaveProperty('members');
    expect(result.members).toHaveLength(2);
  });

  it('チームメンバーを招待できる', async () => {
    const teamId = 'team1';
    const invitee = {
      email: 'test@example.com',
      role: 'editor'
    };
    
    const result = await collaborationService.inviteMember(teamId, invitee);
    
    expect(result).toHaveProperty('inviteId');
    expect(result).toHaveProperty('status', 'pending');
  });

  it('チーム設定を更新できる', async () => {
    const teamId = 'team1';
    const settings = {
      name: 'Updated Team',
      description: 'Updated description',
      visibility: 'private'
    };
    
    const result = await collaborationService.updateTeamSettings(teamId, settings);
    
    expect(result).toHaveProperty('name', settings.name);
    expect(result).toHaveProperty('description', settings.description);
    expect(result).toHaveProperty('visibility', settings.visibility);
  });

  it('メンバーの権限を管理できる', async () => {
    const teamId = 'team1';
    const memberId = 'user1';
    const permissions = {
      canEdit: true,
      canInvite: false,
      canManageSettings: false
    };
    
    const result = await collaborationService.updateMemberPermissions(teamId, memberId, permissions);
    
    expect(result).toHaveProperty('memberId', memberId);
    expect(result.permissions).toEqual(permissions);
  });

  it('リアルタイム編集を同期できる', async () => {
    const documentId = 'doc1';
    const change = {
      type: 'insert',
      position: 10,
      content: 'New content'
    };
    
    const result = await collaborationService.syncEdit(documentId, change);
    
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('changes');
    expect(result).toHaveProperty('timestamp');
  });

  it('編集履歴を管理できる', async () => {
    const documentId = 'doc1';
    
    const history = await collaborationService.getEditHistory(documentId);
    
    expect(Array.isArray(history)).toBe(true);
    history.forEach(entry => {
      expect(entry).toHaveProperty('version');
      expect(entry).toHaveProperty('author');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('changes');
    });
  });

  it('コメントを追加・管理できる', async () => {
    const documentId = 'doc1';
    const comment = {
      content: 'Test comment',
      position: { line: 10, column: 5 }
    };
    
    const result = await collaborationService.addComment(documentId, comment);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('author');
    expect(result).toHaveProperty('content', comment.content);
    expect(result).toHaveProperty('position', comment.position);
  });

  it('変更通知を送信できる', async () => {
    const teamId = 'team1';
    const notification = {
      type: 'edit',
      documentId: 'doc1',
      message: 'Document was edited'
    };
    
    const result = await collaborationService.sendNotification(teamId, notification);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('status', 'sent');
  });

  it('同時編集の競合を解決できる', async () => {
    const documentId = 'doc1';
    const changes = [
      { type: 'insert', position: 10, content: 'A' },
      { type: 'insert', position: 10, content: 'B' }
    ];
    
    const result = await collaborationService.resolveConflict(documentId, changes);
    
    expect(result).toHaveProperty('resolved');
    expect(result).toHaveProperty('finalContent');
  });

  it('エラー時に適切に処理される', async () => {
    const invalidTeamId = 'invalid';
    
    await expect(
      collaborationService.getTeamSettings(invalidTeamId)
    ).rejects.toThrow('Team not found');
  });
}); 