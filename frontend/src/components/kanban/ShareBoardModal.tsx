import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { BoardMember, Role, User } from '../../types';
import { Trash2, UserPlus, Clock, CheckCircle2, AlertCircle, Search, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import { getRoleColor } from '../../lib/colors';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface ShareBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: BoardMember[];
  owner?: User;
  boardId?: string;
  currentUserRole: Role;
  onAddMember: (email: string, role: Role) => Promise<any>;
  onUpdateRole: (memberId: string, role: Role) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const ShareBoardModal: React.FC<ShareBoardModalProps> = ({
  isOpen,
  onClose,
  members,
  owner,
  boardId,
  currentUserRole,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('VIEWER');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState<BoardMember[]>([]);

  // User search suggestion state
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useClickOutside<HTMLDivElement>(
    () => setShowSuggestions(false),
    showSuggestions
  );

  const isOwner = currentUserRole === 'OWNER';

  const fetchPending = async () => {
    if (!boardId || !isOpen) return;
    try {
      const res = await api.get(`/boards/${boardId}/members`);
      if (res.data.pendingInvitations) {
        setPendingInvitations(res.data.pendingInvitations);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPending();
  }, [isOpen, boardId]);

  // Autocomplete search for registered users
  useEffect(() => {
    if (!email.trim() || email.includes('@')) {
      setUserSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/users?q=${encodeURIComponent(email)}`);
        setUserSuggestions(res.data.users || []);
        setShowSuggestions(true);
      } catch (err) {
        setUserSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [email]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email address is required');
    setIsAdding(true);
    setError('');
    setSuccessMsg('');
    setShowSuggestions(false);
    try {
      const res = await onAddMember(email.trim(), role);
      setEmail('');
      setSuccessMsg(res?.data?.message || 'Invitation sent successfully!');
      fetchPending();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Board Members & Access Control"
      description="Invite collaborators, assign roles, and manage permissions."
      size="lg"
    >
      <div className="space-y-6">
        {/* Add Member Form */}
        {(currentUserRole === 'OWNER' || currentUserRole === 'EDITOR') && (
          <form
            onSubmit={handleAdd}
            className="p-4 bg-slate-50/80 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Invite Registered User</span>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-500/20 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-500/20 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 relative">
              <div ref={suggestionsRef} className="flex-1 relative">
                <Input
                  type="email"
                  placeholder="Enter email address (e.g. sam@example.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {/* Autocomplete dropdown suggestions */}
                {showSuggestions && userSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-dropdown z-30 max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {userSuggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setEmail(u.email);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Avatar name={u.name} src={u.avatarUrl} size="xs" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {u.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-36">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
                >
                  <option value="VIEWER">Viewer (Read)</option>
                  <option value="EDITOR">Editor (Edit)</option>
                </select>
              </div>

              <Button type="submit" variant="primary" size="md" isLoading={isAdding}>
                Invite
              </Button>
            </div>
          </form>
        )}

        {/* Member List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Current Members ({members.length + (owner ? 1 : 0)})
          </div>

          <div className="space-y-2">
            {/* Owner Row */}
            {owner && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={owner.name} src={owner.avatarUrl} size="md" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {owner.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {owner.email}
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" dot>
                  OWNER
                </Badge>
              </div>
            )}

            {/* Active Members */}
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.user.name} src={m.user.avatarUrl} size="md" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {m.user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {m.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOwner ? (
                    <select
                      value={m.role}
                      onChange={(e) => onUpdateRole(m.id, e.target.value as Role)}
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 font-semibold dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="EDITOR">Editor</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  ) : (
                    <Badge variant={getRoleColor(m.role) as any}>{m.role}</Badge>
                  )}

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(m.id)}
                      aria-label="Remove member"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="pt-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Invitations ({pendingInvitations.length})</span>
              </div>

              <div className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={inv.user.name} src={inv.user.avatarUrl} size="md" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {inv.user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {inv.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="amber">PENDING</Badge>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={async () => {
                            await onRemoveMember(inv.id);
                            fetchPending();
                          }}
                          aria-label="Cancel invitation"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
