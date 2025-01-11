import { useState, useEffect, useCallback, useMemo } from 'react';
import { Team, User, TeamInvitation, TeamActivity } from '@/types/team';
import {
  getPermissions,
  sendInvitation,
  logTeamActivity,
  checkPermission,
  TeamSyncManager,
  ChangeHistory
} from '@/lib/teamManager';
import { TeamMemberList } from './TeamMemberList';
import { ActivityList } from './ActivityList';
import { InviteModal } from './InviteModal';

interface TeamManagerProps {
  team: Team;
  currentUser: User;
  onTeamUpdate: (team: Team) => void;
}

export function TeamManager({ team, currentUser, onTeamUpdate }: TeamManagerProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('editor');
  const [activities, setActivities] = useState<TeamActivity[]>([]);

  // メモ化したインスタンス
  const syncManager = useMemo(
    () => new TeamSyncManager(team.id, currentUser.id),
    [team.id, currentUser.id]
  );

  const changeHistory = useMemo(() => new ChangeHistory(), []);

  // メモ化したコールバック
  const handleRoleChange = useCallback((userId: string, newRole: User['role']) => {
    if (!checkPermission(currentUser, team, 'canManagePermissions')) {
      alert('権限を変更する権限がありません');
      return;
    }

    const updatedTeam = {
      ...team,
      members: team.members.map(member =>
        member.id === userId
          ? { ...member, role: newRole }
          : member
      ),
      updatedAt: new Date()
    };

    const activity: TeamActivity = {
      id: `act-${Date.now()}`,
      teamId: team.id,
      userId: currentUser.id,
      action: 'edit',
      target: 'permission',
      details: { userId, oldRole: team.members.find(m => m.id === userId)?.role, newRole },
      createdAt: new Date()
    };

    logTeamActivity(activity);
    syncManager.sendUpdate('update', { team: updatedTeam, activity });
    onTeamUpdate(updatedTeam);
  }, [team, currentUser, syncManager, onTeamUpdate]);

  const handleRemoveMember = useCallback((userId: string) => {
    if (!checkPermission(currentUser, team, 'canManagePermissions')) {
      alert('メンバーを削除する権限がありません');
      return;
    }

    const updatedTeam = {
      ...team,
      members: team.members.filter(member => member.id !== userId),
      updatedAt: new Date()
    };

    const activity: TeamActivity = {
      id: `act-${Date.now()}`,
      teamId: team.id,
      userId: currentUser.id,
      action: 'delete',
      target: 'team',
      details: { removedUserId: userId },
      createdAt: new Date()
    };

    logTeamActivity(activity);
    syncManager.sendUpdate('update', { team: updatedTeam, activity });
    onTeamUpdate(updatedTeam);
  }, [team, currentUser, syncManager, onTeamUpdate]);

  const handleInvite = useCallback(async () => {
    if (!checkPermission(currentUser, team, 'canInvite')) {
      alert('メンバーを招待する権限がありません');
      return;
    }

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}`,
      teamId: team.id,
      email: inviteEmail,
      role: inviteRole,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    try {
      await sendInvitation(invitation);
      
      const activity: TeamActivity = {
        id: `act-${Date.now()}`,
        teamId: team.id,
        userId: currentUser.id,
        action: 'invite',
        target: 'team',
        details: { invitation },
        createdAt: new Date()
      };

      await logTeamActivity(activity);
      syncManager.sendUpdate('invite', { invitation, activity });
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('editor');
    } catch (error) {
      console.error('招待の送信に失敗しました:', error);
      alert('招待の送信に失敗しました');
    }
  }, [team, currentUser, inviteEmail, inviteRole, syncManager]);

  // WebSocket接続の管理
  useEffect(() => {
    syncManager.connect();

    const unsubscribe = syncManager.subscribe('update', (data) => {
      onTeamUpdate(data.team);
    });

    return () => {
      unsubscribe();
      syncManager.disconnect();
    };
  }, [syncManager, onTeamUpdate]);

  // チーム活動の監視
  useEffect(() => {
    const unsubscribe = syncManager.subscribe('activity', (data) => {
      setActivities(prev => [data.activity, ...prev].slice(0, 50));
      changeHistory.addChange(data.activity);
    });

    return () => {
      unsubscribe();
    };
  }, [syncManager, changeHistory]);

  // メモ化した権限チェック
  const canInvite = useMemo(
    () => checkPermission(currentUser, team, 'canInvite'),
    [currentUser, team]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{team.name}</h2>
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            メンバーを招待
          </button>
        )}
      </div>

      <TeamMemberList
        team={team}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />

      <ActivityList
        activities={activities}
        team={team}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        role={inviteRole}
        onRoleChange={setInviteRole}
        onInvite={handleInvite}
      />
    </div>
  );
} 