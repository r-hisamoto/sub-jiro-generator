import { memo } from 'react';
import { Team, User } from '@/types/team';
import { checkPermission } from '@/lib/teamManager';

interface TeamMemberListProps {
  team: Team;
  currentUser: User;
  onRoleChange: (userId: string, newRole: User['role']) => void;
  onRemoveMember: (userId: string) => void;
}

export const TeamMemberList = memo(function TeamMemberList({
  team,
  currentUser,
  onRoleChange,
  onRemoveMember
}: TeamMemberListProps) {
  const canManagePermissions = checkPermission(currentUser, team, 'canManagePermissions');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium">チームメンバー</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {team.members.map(member => (
            <TeamMemberItem
              key={member.id}
              member={member}
              canManagePermissions={canManagePermissions}
              isCurrentUser={member.id === currentUser.id}
              onRoleChange={onRoleChange}
              onRemoveMember={onRemoveMember}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});

interface TeamMemberItemProps {
  member: User;
  canManagePermissions: boolean;
  isCurrentUser: boolean;
  onRoleChange: (userId: string, newRole: User['role']) => void;
  onRemoveMember: (userId: string) => void;
}

const TeamMemberItem = memo(function TeamMemberItem({
  member,
  canManagePermissions,
  isCurrentUser,
  onRoleChange,
  onRemoveMember
}: TeamMemberItemProps) {
  return (
    <li className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {member.avatar && (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-full"
              loading="lazy"
            />
          )}
          <div className="ml-3">
            <p className="text-sm font-medium">{member.name}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
        {canManagePermissions && (
          <div className="flex items-center gap-2">
            <select
              value={member.role}
              onChange={(e) => onRoleChange(member.id, e.target.value as User['role'])}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="viewer">閲覧者</option>
              <option value="editor">編集者</option>
              <option value="owner">管理者</option>
            </select>
            {!isCurrentUser && (
              <button
                onClick={() => onRemoveMember(member.id)}
                className="text-red-500 hover:text-red-700"
              >
                削除
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}); 