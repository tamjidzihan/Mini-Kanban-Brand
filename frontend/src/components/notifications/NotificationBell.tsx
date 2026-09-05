import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { BoardInvitation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current user's invitations
  const { data } = useQuery<{ invitations: BoardInvitation[] }>({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await api.get('/invitations');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const invitations = data?.invitations || [];
  const count = invitations.length;

  // Format badge count: 0 is hidden, 1-9 shown as number, >9 shown as '9+'
  const badgeText = count > 9 ? '9+' : count.toString();

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await api.post(`/invitations/${invitationId}/accept`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionMessage({ text: data.message, type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['me-stats'] });
      setTimeout(() => {
        setActionMessage(null);
        if (data.boardId) {
          navigate(`/board/${data.boardId}`);
        }
      }, 1200);
    },
    onError: (err: any) => {
      setActionMessage({
        text: err.response?.data?.message || 'Failed to accept invitation',
        type: 'error',
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await api.post(`/invitations/${invitationId}/decline`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionMessage({ text: data.message, type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['me-stats'] });
      setTimeout(() => setActionMessage(null), 2500);
    },
    onError: (err: any) => {
      setActionMessage({
        text: err.response?.data?.message || 'Failed to decline invitation',
        type: 'error',
      });
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />

        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold leading-none ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden">
            <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Notifications
                </h3>
              </div>
              {count > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {count} Pending
                </span>
              )}
            </div>

            {actionMessage && (
              <div
                className={`mx-3 mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {invitations.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No new invitations
                </div>
              ) : (
                invitations.map((inv) => (
                  <div key={inv.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={inv.board.owner.name} src={inv.board.owner.avatarUrl} size="sm" />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {inv.board.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Invited by <span className="font-medium text-slate-700 dark:text-slate-300">{inv.board.owner.name}</span>
                          </p>
                        </div>
                      </div>
                      <RoleBadge role={inv.role} />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => acceptMutation.mutate(inv.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => declineMutation.mutate(inv.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};