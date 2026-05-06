import React from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  Link, 
  Image as ImageIcon,
  Heading1,
  Heading2,
  Code
} from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingToolbarProps {
  onInsert: (type: string) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ onInsert }) => {
  const tools = [
    { icon: Heading1, label: 'H1', type: 'h1' },
    { icon: Heading2, label: 'H2', type: 'h2' },
    { icon: Bold, label: 'Bold', type: 'bold' },
    { icon: Italic, label: 'Italic', type: 'italic' },
    { icon: List, label: 'List', type: 'list' },
    { icon: Link, label: 'Link', type: 'link' },
    { icon: ImageIcon, label: 'Image', type: 'image' },
    { icon: Code, label: 'Code', type: 'code' },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-2xl ring-1 ring-black/5"
    >
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onInsert(tool.type)}
          className="p-2.5 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 rounded-xl transition-all group relative active:scale-90"
          title={tool.label}
        >
          <tool.icon size={18} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {tool.label}
          </span>
        </button>
      ))}
    </motion.div>
  );
};
