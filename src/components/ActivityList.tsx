import { memo } from 'react';
import { Team, TeamActivity } from '@/types/team';

interface ActivityListProps {
  activities: TeamActivity[];
  team: Team;
}

export const ActivityList = memo(function ActivityList({
  activities,
  team
}: ActivityListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium">活動履歴</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {activities.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              userName={team.members.find(m => m.id === activity.userId)?.name ?? '不明なユーザー'}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});

interface ActivityItemProps {
  activity: TeamActivity;
  userName: string;
}

const ActivityItem = memo(function ActivityItem({
  activity,
  userName
}: ActivityItemProps) {
  const actionText = {
    edit: '編集',
    delete: '削除',
    create: '作成',
    invite: '招待',
    join: '参加',
    leave: '退出'
  }[activity.action];

  return (
    <li className="px-4 py-3">
      <div className="text-sm">
        <span className="font-medium">{userName}</span>
        {' '}が{' '}{actionText}を{activity.target}に対して実行
        <span className="text-gray-500 ml-2">
          {new Date(activity.createdAt).toLocaleString()}
        </span>
      </div>
    </li>
  );
}); 