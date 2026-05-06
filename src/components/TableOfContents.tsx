import React, { useMemo } from 'react';
import { ChevronRight, Hash } from 'lucide-react';
import { motion } from 'motion/react';

interface TOCProps {
  content: string;
  onItemClick: (text: string) => void;
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

export const TableOfContents: React.FC<TOCProps> = ({ content, onItemClick }) => {
  const headings = useMemo(() => {
    const lines = (content || '').split('\n');
    const items: Heading[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        items.push({
          level: match[1].length,
          text: match[2],
          id: match[2].toLowerCase().replace(/\s+/g, '-')
        });
      }
    });
    
    return items;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="toc-panel w-64 border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 overflow-y-auto hidden lg:block h-full">
      <div className="flex items-center gap-2 mb-6">
        <Hash size={14} className="text-indigo-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chapters</span>
      </div>
      
      <div className="space-y-1">
        {headings.map((heading, idx) => (
          <motion.button
            key={`${heading.id}-${idx}`}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onItemClick(heading.text)}
            title={`Jump to ${heading.text}`}
            className="w-full text-left group flex items-start gap-2 py-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-indigo-500">
              <ChevronRight size={12} />
            </span>
            <span 
              className="text-[12px] font-medium leading-tight"
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              {heading.text}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
