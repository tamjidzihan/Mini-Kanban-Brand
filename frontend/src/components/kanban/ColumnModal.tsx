import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Column } from '../../types';
import { AlertCircle } from 'lucide-react';

export interface ColumnModalProps {
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
      title={column ? 'Rename Column' : 'Add New Column'}
      description={column ? 'Change the column status name.' : 'Add a new workflow stage to this board.'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-500/20 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Column Title *"
          placeholder="e.g. In Review / QA"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
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
            {column ? 'Save Changes' : 'Create Column'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
