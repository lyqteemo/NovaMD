import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Columns3,
  Plus,
  Rows3,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

type ColumnAlign = 'left' | 'center' | 'right';

interface TableState {
  headers: string[];
  rows: string[][];
  aligns: ColumnAlign[];
}

interface TableEditorModalProps {
  initialMarkdown?: string;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const DEFAULT_TABLE: TableState = {
  headers: ['Name', 'Status', 'Notes'],
  rows: [
    ['NovaMD', 'Ready', 'Visual table editing'],
    ['Preview', 'Live', 'GFM table rendering'],
  ],
  aligns: ['left', 'center', 'left'],
};

const ALIGN_OPTIONS: Array<{ value: ColumnAlign; icon: React.ElementType; label: string }> = [
  { value: 'left', icon: AlignLeft, label: 'Left align' },
  { value: 'center', icon: AlignCenter, label: 'Center align' },
  { value: 'right', icon: AlignRight, label: 'Right align' },
];

const splitMarkdownRow = (line: string) => {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());
};

const parseAlign = (cell: string): ColumnAlign => {
  const normalized = cell.trim();
  const starts = normalized.startsWith(':');
  const ends = normalized.endsWith(':');
  if (starts && ends) return 'center';
  if (ends) return 'right';
  return 'left';
};

const parseMarkdownTable = (markdown?: string): TableState | null => {
  if (!markdown?.trim()) return null;

  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !lines.every((line) => line.includes('|'))) return null;

  const headers = splitMarkdownRow(lines[0]);
  const divider = splitMarkdownRow(lines[1]);
  const isDivider = divider.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
  if (!headers.length || !isDivider) return null;

  const aligns = headers.map((_, index) => parseAlign(divider[index] || '---'));
  const rows = lines.slice(2).map((line) => {
    const cells = splitMarkdownRow(line);
    return headers.map((_, index) => cells[index] || '');
  });

  return {
    headers,
    rows: rows.length ? rows : [headers.map(() => '')],
    aligns,
  };
};

const escapeCell = (cell: string) => cell.replace(/\n/g, ' ').replace(/\|/g, '\\|').trim();

const alignMarker = (align: ColumnAlign) => {
  if (align === 'center') return ':---:';
  if (align === 'right') return '---:';
  return ':---';
};

const tableToMarkdown = (table: TableState) => {
  const headers = table.headers.map((header, index) => escapeCell(header) || `Column ${index + 1}`);
  const divider = table.aligns.map(alignMarker);
  const rows = table.rows.map((row) => headers.map((_, index) => escapeCell(row[index] || '')));

  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ];

  return `\n${lines.join('\n')}\n`;
};

export const TableEditorModal: React.FC<TableEditorModalProps> = ({
  initialMarkdown,
  onClose,
  onInsert,
}) => {
  const initialTable = useMemo(() => parseMarkdownTable(initialMarkdown) || DEFAULT_TABLE, [initialMarkdown]);
  const [table, setTable] = useState<TableState>(initialTable);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const columnCount = table.headers.length;

  const updateHeader = (index: number, value: string) => {
    setTable((prev) => ({
      ...prev,
      headers: prev.headers.map((header, headerIndex) => headerIndex === index ? value : header),
    }));
  };

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    setTable((prev) => ({
      ...prev,
      rows: prev.rows.map((row, currentRowIndex) => (
        currentRowIndex === rowIndex
          ? row.map((cell, currentColumnIndex) => currentColumnIndex === columnIndex ? value : cell)
          : row
      )),
    }));
  };

  const addColumn = () => {
    setTable((prev) => ({
      headers: [...prev.headers, `Column ${prev.headers.length + 1}`],
      rows: prev.rows.map((row) => [...row, '']),
      aligns: [...prev.aligns, 'left'],
    }));
  };

  const removeColumn = (index: number) => {
    if (columnCount <= 1) return;

    setTable((prev) => ({
      headers: prev.headers.filter((_, headerIndex) => headerIndex !== index),
      rows: prev.rows.map((row) => row.filter((_, columnIndex) => columnIndex !== index)),
      aligns: prev.aligns.filter((_, alignIndex) => alignIndex !== index),
    }));
  };

  const addRow = () => {
    setTable((prev) => ({
      ...prev,
      rows: [...prev.rows, prev.headers.map(() => '')],
    }));
  };

  const removeRow = (index: number) => {
    setTable((prev) => ({
      ...prev,
      rows: prev.rows.length <= 1
        ? [prev.headers.map(() => '')]
        : prev.rows.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const setAlign = (index: number, align: ColumnAlign) => {
    setTable((prev) => ({
      ...prev,
      aligns: prev.aligns.map((currentAlign, alignIndex) => alignIndex === index ? align : currentAlign),
    }));
  };

  const handleInsert = () => {
    onInsert(tableToMarkdown(table));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Table editor"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.16 }}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Table2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">Table Editor</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {table.rows.length} rows · {columnCount} columns
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600 active:scale-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
          >
            <Rows3 size={15} />
            Add row
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600 active:scale-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
          >
            <Columns3 size={15} />
            Add column
          </button>
        </div>

        <div className="minimal-scrollbar flex-1 overflow-auto p-5">
          <div className="min-w-max overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse bg-white text-sm dark:bg-slate-950">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900">
                  {table.headers.map((header, columnIndex) => (
                    <th
                      key={`header-${columnIndex}`}
                      className="min-w-44 border-b border-r border-slate-200 p-2 align-top last:border-r-0 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={header}
                          onChange={(event) => updateHeader(columnIndex, event.target.value)}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          aria-label={`Header ${columnIndex + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeColumn(columnIndex)}
                          disabled={columnCount <= 1}
                          title="Remove column"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {ALIGN_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAlign(columnIndex, option.value)}
                            title={option.label}
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-lg transition-all active:scale-95",
                              table.aligns[columnIndex] === option.value
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "text-slate-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                            )}
                          >
                            <option.icon size={15} />
                          </button>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="border-b border-slate-200 last:border-b-0 dark:border-slate-800">
                    {row.map((cell, columnIndex) => (
                      <td
                        key={`cell-${rowIndex}-${columnIndex}`}
                        className="border-r border-slate-200 p-2 last:border-r-0 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            value={cell}
                            onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
                          />
                          {columnIndex === columnCount - 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(rowIndex)}
                              title="Remove row"
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-95 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-black uppercase tracking-wider text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <X size={15} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <Check size={15} />
            Insert table
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
