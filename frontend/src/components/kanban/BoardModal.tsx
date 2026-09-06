import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Board } from '../../types';
import { AlertCircle } from 'lucide-react';

export interface BoardModalProps {
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
      title={board ? 'Edit Board Details' : 'Create New Board'}
      description={board ? 'Update workspace title and purpose.' : 'Create a collaborative workspace for your team.'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-500/20 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Board Title *"
          placeholder="e.g. Website Redesign Q3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          rows={3}
          placeholder="Brief summary of the goals and deliverables..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            {board ? 'Save Changes' : 'Create Board'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
