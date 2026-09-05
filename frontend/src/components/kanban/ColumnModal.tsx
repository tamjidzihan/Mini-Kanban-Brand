import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Column } from '../../types';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  column?: Column | null;
  isLoading?: boolean;
}

export const ColumnModal: React.FC<ColumnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  column,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (column) {
      setTitle(column.title);
    } else {
      setTitle('');
    }
    setError('');
  }, [column, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Column title is required');
      return;
    }
    try {
      await onSubmit(title.trim());
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save column');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={column ? 'Rename Column' : 'Create New Column'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/60 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}
        <Input
          label="Column Title *"
          placeholder="e.g. In Review"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {column ? 'Save Changes' : 'Create Column'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
