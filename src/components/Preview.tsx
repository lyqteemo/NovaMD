import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface PreviewProps {
  content: string;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  isDarkMode: boolean;
}

const codeTheme = {
  'code[class*="language-"]': {
    color: '#dbeafe',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92em',
    lineHeight: '1.75',
    textShadow: 'none',
    whiteSpace: 'pre'
  },
  'pre[class*="language-"]': {
    color: '#dbeafe',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92em',
    lineHeight: '1.75',
    textShadow: 'none'
  },
  comment: { color: '#94a3b8', fontStyle: 'italic', background: 'transparent' },
  prolog: { color: '#94a3b8', background: 'transparent' },
  doctype: { color: '#94a3b8', background: 'transparent' },
  cdata: { color: '#94a3b8', background: 'transparent' },
  punctuation: { color: '#cbd5e1', background: 'transparent' },
  property: { color: '#93c5fd', background: 'transparent' },
  tag: { color: '#fca5a5', background: 'transparent' },
  boolean: { color: '#c4b5fd', background: 'transparent' },
  number: { color: '#c4b5fd', background: 'transparent' },
  constant: { color: '#c4b5fd', background: 'transparent' },
  symbol: { color: '#f0abfc', background: 'transparent' },
  deleted: { color: '#fca5a5', background: 'transparent' },
  selector: { color: '#86efac', background: 'transparent' },
  'attr-name': { color: '#fde68a', background: 'transparent' },
  string: { color: '#86efac', background: 'transparent' },
  char: { color: '#86efac', background: 'transparent' },
  builtin: { color: '#67e8f9', background: 'transparent' },
  inserted: { color: '#86efac', background: 'transparent' },
  operator: { color: '#f9a8d4', background: 'transparent' },
  entity: { color: '#f9a8d4', background: 'transparent' },
  url: { color: '#67e8f9', background: 'transparent' },
  atrule: { color: '#fde68a', background: 'transparent' },
  'attr-value': { color: '#86efac', background: 'transparent' },
  keyword: { color: '#c084fc', background: 'transparent' },
  function: { color: '#7dd3fc', background: 'transparent' },
  'class-name': { color: '#fde68a', background: 'transparent' },
  regex: { color: '#fdba74', background: 'transparent' },
  important: { color: '#fdba74', background: 'transparent' },
  variable: { color: '#bfdbfe', background: 'transparent' },
};

export const Preview: React.FC<PreviewProps> = ({ content, onScroll, isDarkMode }) => {
  return (
    <div 
      onScroll={onScroll}
      className="minimal-scrollbar h-full w-full overflow-y-auto p-12 scroll-smooth selection:bg-indigo-100 dark:selection:bg-slate-800"
    >
      <div className="markdown-body prose prose-slate dark:prose-invert w-full max-w-4xl mx-auto rounded-xl px-10 pb-32 pt-2 shadow-[0_18px_60px_-55px_rgba(15,23,42,0.45)]">
        <Markdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="relative group/code">
                  <div className="absolute top-3 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-0 group-hover/code:opacity-100 transition-opacity">
                    {match[1]}
                  </div>
                  <SyntaxHighlighter
                    style={codeTheme}
                    language={match[1]}
                    PreTag="div"
                    className="!m-0 !bg-transparent !p-6"
                    customStyle={{
                      margin: 0,
                      background: 'transparent',
                    }}
                    codeTagProps={{
                      className: 'preview-code-content',
                      style: {
                        background: 'transparent',
                        fontFamily: 'var(--font-mono)',
                        textShadow: 'none',
                      }
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
};
