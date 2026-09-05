import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import { BoardMember, Role, User } from '../../types';
import { Trash2, UserPlus } from 'lucide-react';

interface ShareBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: BoardMember[];
  owner?: User;
  currentUserRole: Role;
  onAddMember: (email: string, role: Role) => Promise<void>;
  onUpdateRole: (memberId: string, role: Role) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const ShareBoardModal: React.FC<ShareBoardModalProps> = ({
  isOpen,
  onClose,
  members,
  owner,
  currentUserRole,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('VIEWER');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const isOwner = currentUserRole === 'OWNER';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email address is required');
    setIsAdding(true);
    setError('');
    try {
      await onAddMember(email.trim(), role);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Board Members & Sharing"
      description="Invite collaborators and manage permissions."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Add Member Form */}
        {(currentUserRole === 'OWNER' || currentUserRole === 'EDITOR') && (
          <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Invite New Member
            </h4>
            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <Button type="submit" isLoading={isAdding} size="md">
                Invite
              </Button>
            </div>
          </form>
        )}

        {/* Member List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Current Members ({members.length + (owner ? 1 : 0)})
          </h4>

          {/* Owner Display */}
          {owner && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar name={owner.name} src={owner.avatarUrl} size="md" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{owner.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{owner.email}</p>
                </div>
              </div>
              <RoleBadge role="OWNER" />
            </div>
          )}

          {/* Members */}
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.user.name} src={m.user.avatarUrl} size="md" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
                  <select
                    value={m.role}
                    onChange={(e) => onUpdateRole(m.id, e.target.value as Role)}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="OWNER">Owner</option>
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}

                {isOwner && (
                  <button
                    onClick={() => onRemoveMember(m.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
