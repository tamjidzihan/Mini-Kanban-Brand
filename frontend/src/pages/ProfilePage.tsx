import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { Board } from '../types';
import { User, Lock, Mail, ShieldCheck, CheckCircle2, AlertCircle, Kanban, Users, CheckSquare } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
    setProfileSuccess('');
    setProfileError('');
    setIsSavingProfile(true);

    try {
      const res = await api.patch('/auth/profile', {
        name,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      });

      setUser(res.data.user);
      setProfileSuccess('Profile updated successfully!');
      refetchMe();
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setIsSavingPassword(true);

    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar boards={boardsData?.boards} />
        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-subtle relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              <Avatar name={user?.name || ''} src={avatarUrl || user?.avatarUrl} size="lg" className="w-20 h-20 text-2xl ring-4 ring-indigo-500/20" />
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {user?.name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold self-center sm:self-auto">
                    <ShieldCheck className="w-4 h-4" /> User Account
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                  <Kanban className="w-5 h-5" />
                  <span>{stats.ownedBoards}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Owned Boards</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                  <Users className="w-5 h-5" />
                  <span>{stats.memberBoards}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shared Boards</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                  <CheckSquare className="w-5 h-5" />
                  <span>{stats.assignedTasks}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assigned Tasks</span>
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edit Personal Info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Personal Information
                  </h2>
                </div>

                {profileSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed pr-10"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <Input
                  label="Avatar Image URL (Optional)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />

                <Button type="submit" isLoading={isSavingProfile} className="w-full mt-2">
                  Save Profile Changes
                </Button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-subtle flex flex-col justify-between">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Security & Password
                  </h2>
                </div>

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

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

                <Button type="submit" variant="secondary" isLoading={isSavingPassword} className="w-full mt-2">
                  Update Password
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};