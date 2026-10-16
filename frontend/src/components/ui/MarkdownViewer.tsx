import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/cn';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  emptyMessage?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className,
  emptyMessage = 'No description provided.',
}) => {
  if (!content.trim()) {
    return <p className="text-xs text-slate-400 italic">{emptyMessage}</p>;
  }

  return (
    <div
      className={cn(
        'min-w-0 break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300',
        '[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:border-b [&_h1]:border-gray-200 [&_h1]:pb-1 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:border-gray-700 dark:[&_h1]:text-white',
        '[&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white',
        '[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100',
        '[&_p]:my-1.5 [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-white',
        '[&_a]:text-emerald-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-emerald-600 dark:[&_a]:text-emerald-400',
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
        '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-500 dark:[&_blockquote]:text-slate-400',
        '[&_hr]:my-3 [&_hr]:border-gray-200 dark:[&_hr]:border-gray-700',
        '[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 dark:[&_th]:border-gray-700 dark:[&_th]:bg-gray-800 dark:[&_td]:border-gray-700',
        '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3 dark:[&_pre]:bg-gray-800',
        '[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-emerald-800 dark:[&_code]:bg-gray-800 dark:[&_code]:text-emerald-300',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};
