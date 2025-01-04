import { memo } from 'react';
import { User } from '@/types/team';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  role: User['role'];
  onRoleChange: (role: User['role']) => void;
  onInvite: () => void;
}

export const InviteModal = memo(function InviteModal({
  isOpen,
  onClose,
  email,
  onEmailChange,
  role,
  onRoleChange,
  onInvite
}: InviteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">メンバーを招待</h4>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="example@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">権限</label>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as User['role'])}
              className="w-full p-2 border rounded"
            >
              <option value="viewer">閲覧者</option>
              <option value="editor">編集者</option>
              <option value="owner">管理者</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={onInvite}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              招待を送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}); 