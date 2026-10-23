import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Kanban, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const nameError =
    submitted && name.trim().length < 2 ? 'Enter a name with at least 2 characters.' : '';
  const emailError =
    submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : '';
  const passwordError =
    submitted && password.length < 6 ? 'Use at least 6 characters.' : '';
  const confirmPasswordError =
    submitted && password !== confirmPassword ? 'Passwords do not match.' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedName.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      password.length < 6 ||
      password !== confirmPassword
    ) {
      return;
    }

    setIsLoading(true);

    try {
      await register(normalizedName, normalizedEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-4">
        <Card className="p-8 space-y-6 shadow-dropdown">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <img
                src="/logo-full.png"
                alt="Taskgrid"
                className="h-11 w-auto object-contain dark:hidden"
              />
              <div className="hidden dark:flex items-center gap-2.5">
                <img src="/logo-icon.png" alt="Taskgrid" className="w-10 h-10 object-contain" />
                <span className="font-extrabold text-2xl tracking-tight text-white leading-none">
                  Task<span className="text-emerald-400">grid</span>
                </span>
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              <span>Create your Account</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Start creating boards and collaborating with your team
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 text-xs font-medium rounded-xl border border-rose-500/20 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="register-name"
              label="Full Name"
              placeholder="Your name"
              autoComplete="name"
              autoCapitalize="words"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              error={nameError}
              required
            />

            <Input
              id="register-email"
              label="Email address"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={emailError}
              required
            />

            <Input
              id="register-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              error={passwordError}
              helperText={!passwordError ? 'Use at least 6 characters.' : undefined}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              minLength={6}
              required
            />

            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Enter your password again"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              error={confirmPasswordError}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={
                    showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'
                  }
                  aria-pressed={showConfirmPassword}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
