import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Kanban, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-4">
        <Card className="p-8 space-y-6 shadow-dropdown">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
              <Kanban className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <span>Sign in to Mini Kanban</span>
              <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Collaborative workspaces, drag-and-drop boards & permissions.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 text-xs font-medium rounded-xl border border-rose-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              Quick Demo Accounts (password123)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('alex@example.com')}
                className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors"
              >
                👑 Owner
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('sam@example.com')}
                className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-gray-700 hover:border-sky-400 transition-colors"
              >
                ✏️ Editor
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('taylor@example.com')}
                className="py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-gray-700 hover:border-violet-400 transition-colors"
              >
                👁️ Viewer
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
