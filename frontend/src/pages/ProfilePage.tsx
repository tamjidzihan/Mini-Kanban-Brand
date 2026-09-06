import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLayout } from '../components/layout/PageLayout';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { Board } from '../types';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Kanban,
  Users,
  CheckSquare,
  KeyRound,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const { data: boardsData } = useQuery<{ boards: Board[] }>({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await api.get('/boards');
      return res.data;
    },
  });

  const { data: meData, refetch: refetchMe } = useQuery({
    queryKey: ['me-stats'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
  });

  const stats = meData?.stats || { ownedBoards: 0, memberBoards: 0, assignedTasks: 0 };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const res = await api.patch('/auth/profile', {
        name,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      });

      setUser(res.data.user);
      toast.success('Profile updated successfully.');
      refetchMe();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <PageLayout boards={boardsData?.boards}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Profile Banner Card */}
        <Card className="p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <Avatar
              name={user?.name || ''}
              src={avatarUrl || user?.avatarUrl}
              size="lg"
              className="w-20 h-20 text-2xl ring-4 ring-emerald-500/20"
            />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {user?.name}
                </h1>
                <Badge variant="emerald" dot>
                  Verified User Account
                </Badge>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-4 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-lg tabular-nums">
                <Kanban className="w-4 h-4" />
                <span>{stats.ownedBoards}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Owned Boards
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold text-lg tabular-nums">
                <Users className="w-4 h-4" />
                <span>{stats.memberBoards}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Shared Boards
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-lg tabular-nums">
                <CheckSquare className="w-4 h-4" />
                <span>{stats.assignedTasks}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Assigned Tasks
              </span>
            </div>
          </div>
        </Card>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Personal Info */}
          <Card className="p-6 flex flex-col justify-between">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Personal Profile
                </h2>
              </div>

              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed pr-10"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <Input
                label="Avatar Image URL (Optional)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingProfile}
                className="w-full mt-2"
              >
                Save Profile Changes
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="p-6 flex flex-col justify-between">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Security & Password
                </h2>
              </div>

              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />

              <Input
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />

              <Button
                type="submit"
                variant="secondary"
                size="md"
                isLoading={isSavingPassword}
                className="w-full mt-2"
              >
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};