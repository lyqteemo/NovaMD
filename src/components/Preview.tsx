import React from 'react';
import Markdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);

interface PreviewProps {
  content: string;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  isDarkMode: boolean;
  themePreset: 'classic' | 'forest' | 'rose' | 'ink';
}

const codeTheme = {
  'code[class*="language-"]': {
    color: 'var(--theme-code-text)',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92em',
    lineHeight: '1.75',
    textShadow: 'none',
    whiteSpace: 'pre'
  },
  'pre[class*="language-"]': {
    color: 'var(--theme-code-text)',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92em',
    lineHeight: '1.75',
    textShadow: 'none'
  },
  comment: { color: 'var(--theme-code-muted)', fontStyle: 'italic', background: 'transparent' },
  prolog: { color: 'var(--theme-code-muted)', background: 'transparent' },
  doctype: { color: 'var(--theme-code-muted)', background: 'transparent' },
  cdata: { color: 'var(--theme-code-muted)', background: 'transparent' },
  punctuation: { color: 'var(--theme-code-punctuation)', background: 'transparent' },
  property: { color: 'var(--theme-code-property)', background: 'transparent' },
  tag: { color: 'var(--theme-code-tag)', background: 'transparent' },
  boolean: { color: 'var(--theme-code-literal)', background: 'transparent' },
  number: { color: 'var(--theme-code-literal)', background: 'transparent' },
  constant: { color: 'var(--theme-code-literal)', background: 'transparent' },
  symbol: { color: 'var(--theme-code-symbol)', background: 'transparent' },
  deleted: { color: 'var(--theme-code-tag)', background: 'transparent' },
  selector: { color: 'var(--theme-code-string)', background: 'transparent' },
  'attr-name': { color: 'var(--theme-code-attr)', background: 'transparent' },
  string: { color: 'var(--theme-code-string)', background: 'transparent' },
  char: { color: 'var(--theme-code-string)', background: 'transparent' },
  builtin: { color: 'var(--theme-code-function)', background: 'transparent' },
  inserted: { color: 'var(--theme-code-string)', background: 'transparent' },
  operator: { color: 'var(--theme-code-operator)', background: 'transparent' },
  entity: { color: 'var(--theme-code-operator)', background: 'transparent' },
  url: { color: 'var(--theme-code-function)', background: 'transparent' },
  atrule: { color: 'var(--theme-code-attr)', background: 'transparent' },
  'attr-value': { color: 'var(--theme-code-string)', background: 'transparent' },
  keyword: { color: 'var(--theme-code-keyword)', background: 'transparent' },
  function: { color: 'var(--theme-code-function)', background: 'transparent' },
  'class-name': { color: 'var(--theme-code-attr)', background: 'transparent' },
  regex: { color: 'var(--theme-code-regex)', background: 'transparent' },
  important: { color: 'var(--theme-code-regex)', background: 'transparent' },
  variable: { color: 'var(--theme-code-variable)', background: 'transparent' },
};

const mermaidThemeVariables = {
  classic: {
    light: {
      primaryColor: '#eef2ff',
      primaryTextColor: '#1e293b',
      primaryBorderColor: '#818cf8',
      lineColor: '#4f46e5',
      textColor: '#1e293b',
      mainBkg: '#f8fafc',
      clusterBkg: '#eef2ff',
      clusterBorder: '#c7d2fe',
      edgeLabelBackground: '#ffffff',
    },
    dark: {
      primaryColor: '#1e1b4b',
      primaryTextColor: '#e0e7ff',
      primaryBorderColor: '#818cf8',
      lineColor: '#a5b4fc',
      textColor: '#e2e8f0',
      mainBkg: '#0f172a',
      clusterBkg: '#111827',
      clusterBorder: '#6366f1',
      edgeLabelBackground: '#0f172a',
    },
  },
  forest: {
    light: {
      primaryColor: '#edf7f0',
      primaryTextColor: '#1f3528',
      primaryBorderColor: '#6ee7b7',
      lineColor: '#047857',
      textColor: '#1f3528',
      mainBkg: '#fbfff9',
      clusterBkg: '#edf7f0',
      clusterBorder: '#a7f3d0',
      edgeLabelBackground: '#ffffff',
    },
    dark: {
      primaryColor: '#0b2418',
      primaryTextColor: '#d9f5e5',
      primaryBorderColor: '#34d399',
      lineColor: '#6ee7b7',
      textColor: '#d9f5e5',
      mainBkg: '#0b1f16',
      clusterBkg: '#081a11',
      clusterBorder: '#34d399',
      edgeLabelBackground: '#0b1f16',
    },
  },
  rose: {
    light: {
      primaryColor: '#fff1f4',
      primaryTextColor: '#3b2028',
      primaryBorderColor: '#fda4af',
      lineColor: '#be123c',
      textColor: '#3b2028',
      mainBkg: '#fffafb',
      clusterBkg: '#fff1f4',
      clusterBorder: '#fecdd3',
      edgeLabelBackground: '#ffffff',
    },
    dark: {
      primaryColor: '#2b1018',
      primaryTextColor: '#ffe4ea',
      primaryBorderColor: '#fb7185',
      lineColor: '#fda4af',
      textColor: '#ffe4ea',
      mainBkg: '#220d14',
      clusterBkg: '#210b12',
      clusterBorder: '#fb7185',
      edgeLabelBackground: '#220d14',
    },
  },
  ink: {
    light: {
      primaryColor: '#eef2f8',
      primaryTextColor: '#172033',
      primaryBorderColor: '#93c5fd',
      lineColor: '#1d4ed8',
      textColor: '#172033',
      mainBkg: '#fbfdff',
      clusterBkg: '#eef2f8',
      clusterBorder: '#bfdbfe',
      edgeLabelBackground: '#ffffff',
    },
    dark: {
      primaryColor: '#0d1426',
      primaryTextColor: '#e6ecff',
      primaryBorderColor: '#60a5fa',
      lineColor: '#93c5fd',
      textColor: '#e6ecff',
      mainBkg: '#0a1020',
      clusterBkg: '#080d1d',
      clusterBorder: '#60a5fa',
      edgeLabelBackground: '#0a1020',
    },
  },
} as const;

const mermaidRenderCache = new Map<string, string>();

interface MermaidBlockProps {
  chart: string;
  isDarkMode: boolean;
  themePreset: PreviewProps['themePreset'];
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = React.useState(false);

  const copyWithFallback = () => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          copyWithFallback();
        }
      } else {
        copyWithFallback();
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      console.error('Failed to copy code block', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="code-copy-button"
      title={copied ? 'Copied' : 'Copy code'}
      aria-label={copied ? 'Copied code' : 'Copy code'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

const MermaidBlock: React.FC<MermaidBlockProps> = ({ chart, isDarkMode, themePreset }) => {
  const id = React.useId().replace(/:/g, '');
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    const renderDiagram = async () => {
      const cacheKey = `${themePreset}:${isDarkMode ? 'dark' : 'light'}:${chart}`;
      const cachedSvg = mermaidRenderCache.get(cacheKey);
      if (cachedSvg) {
        setSvg(cachedSvg);
        setError(null);
        return;
      }

      try {
        const { default: mermaid } = await import('mermaid');

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDarkMode ? 'dark' : 'default',
          themeVariables: {
            background: 'transparent',
            ...mermaidThemeVariables[themePreset][isDarkMode ? 'dark' : 'light'],
          },
        });

        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!isCancelled) {
          mermaidRenderCache.set(cacheKey, svg);
          setSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setSvg('');
          setError(err instanceof Error ? err.message : 'Failed to render Mermaid diagram.');
        }
      }
    };

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [chart, id, isDarkMode, themePreset]);

  return (
    <div className="code-card code-card-diagram group/code">
      <div className="code-card-header">
        <span className="code-card-language">mermaid</span>
        <CopyButton value={chart} />
      </div>
      <div className="mermaid-card-body">
        {error ? (
          <div className="mermaid-error">
            {error}
          </div>
        ) : (
          <div
            className="mermaid-block"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const label = language || 'text';

  return (
    <div className="code-card group/code">
      <div className="code-card-header">
        <span className="code-card-language">{label}</span>
        <CopyButton value={code} />
      </div>
      <div className="code-card-body">
        <SyntaxHighlighter
          style={codeTheme}
          language={language || 'text'}
          PreTag="div"
          className="!m-0 !bg-transparent !p-0"
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
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const Preview: React.FC<PreviewProps> = ({ content, onScroll, isDarkMode, themePreset }) => {
  return (
    <div 
      onScroll={onScroll}
      className="minimal-scrollbar h-full w-full overflow-y-auto p-12 scroll-smooth selection:bg-indigo-100 dark:selection:bg-slate-800"
    >
      <div className="markdown-body prose prose-slate dark:prose-invert w-full max-w-4xl mx-auto rounded-xl px-10 pb-32 pt-2 shadow-[0_18px_60px_-55px_rgba(15,23,42,0.45)]">
        <Markdown 
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            pre({ children }: any) {
              const child = Array.isArray(children) ? children[0] : children;
              const className = child?.props?.className || '';
              const match = /language-([\w-]+)/.exec(className);
              const language = match?.[1];
              const code = String(child?.props?.children || '').replace(/\n$/, '');

              if (language === 'mermaid') {
                return <MermaidBlock chart={code} isDarkMode={isDarkMode} themePreset={themePreset} />;
              }

              return <CodeBlock code={code} language={language} />;
            },
            code({ node, inline, className, children, ...props }: any) {
              if (!inline) return null;

              return (
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
