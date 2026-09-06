import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Kanban, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-soft">
        <Kanban className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        The workspace or resource you are looking for does not exist, or you do not have permission to view it.
      </p>
      <Link to="/" className="pt-2">
        <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
