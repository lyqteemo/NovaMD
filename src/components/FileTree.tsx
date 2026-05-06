import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  handle: any;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (handle: any) => void;
  activeFileHandle?: any;
}

const FileTreeNode: React.FC<{
  node: FileNode;
  level: number;
  onFileSelect: (handle: any) => void;
  activeFileHandle?: any;
}> = ({ node, level, onFileSelect, activeFileHandle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = activeFileHandle?.name === node.name;

  if (node.kind === 'file') {
    if (!node.name.toLowerCase().endsWith('.md')) return null;
    return (
      <button
        onClick={() => onFileSelect(node.handle as FileSystemFileHandle)}
        title={`Open ${node.name}`}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all duration-200 rounded-lg group",
          isSelected 
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
            : "hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <FileText size={14} className={cn("transition-colors", isSelected ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`${isOpen ? 'Collapse' : 'Expand'} ${node.name}`}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors rounded-lg group"
        style={{ paddingLeft: `${level * 12 + 10}px` }}
      >
        <div className={cn("transition-transform duration-200", isOpen && "rotate-90")}>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
        <Folder size={14} className={cn("transition-colors", isOpen ? "text-indigo-500" : "text-slate-400")} />
        <span className="truncate font-bold uppercase tracking-widest text-[9px]">{node.name}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children?.map((child) => (
              <FileTreeNode
                key={child.name}
                node={child}
                level={level + 1}
                onFileSelect={onFileSelect}
                activeFileHandle={activeFileHandle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, activeFileHandle }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto py-2">
      {files.map((node) => (
        <FileTreeNode
          key={node.name}
          node={node}
          level={0}
          onFileSelect={onFileSelect}
          activeFileHandle={activeFileHandle}
        />
      ))}
    </div>
  );
};
