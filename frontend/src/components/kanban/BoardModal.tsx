import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Board } from '../../types';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description?: string) => Promise<void>;
  board?: Board | null;
  isLoading?: boolean;
}

export const BoardModal: React.FC<BoardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  board,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (board) {
      setTitle(board.title);
      setDescription(board.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError('');
  }, [board, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Board title is required');
      return;
    }
    try {
      await onSubmit(title.trim(), description.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save board');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={board ? 'Edit Board Settings' : 'Create New Board'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/60 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}
        <Input
          label="Board Title *"
          placeholder="e.g. Website Redesign Q3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            placeholder="Brief overview of the project board..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {board ? 'Save Changes' : 'Create Board'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
