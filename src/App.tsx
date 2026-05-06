/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import hotkeys from 'hotkeys-js';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { cn } from './lib/utils';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { FloatingToolbar } from './components/FloatingToolbar';
import { TableOfContents } from './components/TableOfContents';
import { useMarkdownHistory } from './hooks/useMarkdownHistory';
import { 
  Sun, 
  Moon, 
  RotateCcw, 
  RotateCw, 
  Type, 
  Eye, 
  Columns,
  Trash2,
  FileCode2,
  CheckCircle2,
  Download,
  Printer,
  FileJson,
  FileText,
  FilePlus2,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Save
} from 'lucide-react';


const DEFAULT_MARKDOWN = `# NovaMD Pro

A **modern** writing experience. Built with React and Tailwind CSS.

## The Vision
- **Typora Quality**: Minimalist aesthetics with powerful rendering.
- **Bi-directional Sync**: Smooth split-pane experience.
- **Glassmorphism**: Elegant floating controls.

| Feature | Status |
| :--- | :--- |
| Auto-save | Active |
| Dark Mode | Supported |
| Code Highlighting | Prism.js |

\`\`\`javascript
const editor = {
  theme: 'NovaMinimal',
  focusMode: true,
  autosave: 'localStorage'
};
\`\`\`

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

### Tables & Lists
- Table stripes and modern padding
- Accent-colored blockquotes
- Floating toolbar for formatting
`;

const getInitialMarkdown = () => {
  const savedContent = localStorage.getItem('novamd-content');
  if (!savedContent || savedContent === 'undefined') return DEFAULT_MARKDOWN;
  return savedContent;
};

const NEW_MARKDOWN = `# Untitled

`;

const THEME_PRESETS = [
  { id: 'classic', label: 'Classic' },
  { id: 'forest', label: 'Forest' },
  { id: 'rose', label: 'Rose' },
  { id: 'ink', label: 'Ink' },
] as const;

type ThemePreset = typeof THEME_PRESETS[number]['id'];

interface OpenDocument {
  id: string;
  name: string;
  content: string;
  handle: FileSystemFileHandle | null;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const { content, updateContent, undo, redo, canUndo, canRedo } = useMarkdownHistory(getInitialMarkdown());

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [themePreset, setThemePreset] = useState<ThemePreset>(() => {
    return (localStorage.getItem('novamd-theme-preset') as ThemePreset) || 'classic';
  });
  const [showTOC, setShowTOC] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [activeDocumentName, setActiveDocumentName] = useState<string | null>(null);
  const [openDocuments, setOpenDocuments] = useState<OpenDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollingSourceRef = useRef<string | null>(null);

  const handleOpenDocument = () => {
    fileInputRef.current?.click();
  };

  const createDocumentId = () => {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const activateDocument = (document: OpenDocument) => {
    setActiveDocumentId(document.id);
    setActiveFileHandle(document.handle);
    setActiveDocumentName(document.name);
    updateContent(document.content);
  };

  const addOpenDocument = (name: string, documentContent: string, handle: FileSystemFileHandle | null) => {
    const document: OpenDocument = {
      id: createDocumentId(),
      name,
      content: documentContent,
      handle
    };

    setOpenDocuments(prev => [...prev, document]);
    activateDocument(document);
    setShowSidebar(true);
  };

  const updateActiveOpenDocument = (updates: Partial<Omit<OpenDocument, 'id'>>) => {
    if (!activeDocumentId) return;
    setOpenDocuments(prev => prev.map(document => (
      document.id === activeDocumentId ? { ...document, ...updates } : document
    )));
  };

  const handleNewDocument = () => {
    const hasContent = content.trim().length > 0;
    const shouldCreate = !hasContent || window.confirm('Create a new document? Unsaved changes will be lost.');
    if (!shouldCreate) return;

    addOpenDocument('Untitled.md', NEW_MARKDOWN, null);
  };

  const isMarkdownFile = (file: File) => {
    const name = file.name.toLowerCase();
    return name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.mdown') || name.endsWith('.txt');
  };

  const openMarkdownFile = async (file: File) => {
    const text = await file.text();
    addOpenDocument(file.name, text, null);
  };

  const handleFileSelect = async (handle: FileSystemFileHandle) => {
    try {
      const file = await handle.getFile();
      const text = await file.text();
      addOpenDocument(handle.name, text, handle);
    } catch (err) {
      console.error('Failed to read file', err);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(isMarkdownFile);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        await openMarkdownFile(file);
      }
    } catch (err) {
      console.error('Failed to read file', err);
      alert('Could not open document.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAppDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer.items).some((item) => item.kind === 'file')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleAppDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    const files = Array.from(event.dataTransfer.files);
    const markdownFiles = files.filter(isMarkdownFile);
    if (markdownFiles.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    try {
      for (const file of markdownFiles) {
        await openMarkdownFile(file);
      }
    } catch (err) {
      console.error('Failed to read dropped markdown file', err);
      alert('Could not open dropped Markdown file.');
    }
  };

  const showSavedToast = () => {
    setShowSaveToast(true);
    window.setTimeout(() => setShowSaveToast(false), 1800);
  };

  const fallbackDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDocumentName || `NovaMD-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveDocumentAs = async () => {
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: activeDocumentName || `NovaMD-${Date.now()}.md`,
        types: [
          {
            description: 'Markdown document',
            accept: {
              'text/markdown': ['.md', '.markdown', '.mdown'],
              'text/plain': ['.txt']
            }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      setActiveFileHandle(handle);
      setActiveDocumentName(handle.name);
      updateActiveOpenDocument({ name: handle.name, handle });
      return;
    }

    fallbackDownloadMarkdown();
  };

  const handleLocalSave = async () => {
    setIsSaving(true);
    try {
      if (activeFileHandle) {
        const writable = await (activeFileHandle as any).createWritable();
        await writable.write(content);
        await writable.close();
        updateActiveOpenDocument({ content, handle: activeFileHandle });
      } else {
        await saveDocumentAs();
      }
      showSavedToast();
      setTimeout(() => setIsSaving(false), 1000);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setIsSaving(false);
        return;
      }
      console.error('Failed to save file', err);
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportHTML = () => {
    const htmlContent = document.querySelector('.markdown-body')?.innerHTML;
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Exported from NovaMD</title>
          <style>
            body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; max-width: 800px; margin: auto; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 8px; overflow-x: auto; }
            blockquote { border-left: 4px solid #4f46e5; padding-left: 20px; font-style: italic; color: #666; }
            img { max-width: 100%; height: auto; border-radius: 8px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f9f9f9; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NovaMD-Export-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NovaMD-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJumpToSection = (text: string) => {
    const previewScroller = previewRef.current?.querySelector('.minimal-scrollbar') as HTMLDivElement | null;
    const previewBody = previewRef.current?.querySelector('.markdown-body');
    if (previewScroller && previewBody) {
      const headings = previewBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (let h of Array.from(headings)) {
        if (h.textContent === text) {
          const headingTop = (h as HTMLElement).offsetTop;
          previewScroller.scrollTo({
            top: Math.max(headingTop - 32, 0),
            behavior: 'smooth'
          });
          break;
        }
      }
    }
  };

  useEffect(() => {
    hotkeys('ctrl+b,cmd+b', (e) => { e.preventDefault(); handleInsert('bold'); });
    hotkeys('ctrl+i,cmd+i', (e) => { e.preventDefault(); handleInsert('italic'); });
    hotkeys('ctrl+k,cmd+k', (e) => { e.preventDefault(); handleInsert('link'); });
    hotkeys('ctrl+p,cmd+p', (e) => { e.preventDefault(); handleExportPDF(); });
    hotkeys('ctrl+o,cmd+o', (e) => { e.preventDefault(); handleOpenDocument(); });
    hotkeys('ctrl+s,cmd+s', (e) => { 
      e.preventDefault(); 
      handleLocalSave();
    });
    
    return () => {
      hotkeys.unbind('ctrl+b,cmd+b');
      hotkeys.unbind('ctrl+i,cmd+i');
      hotkeys.unbind('ctrl+k,cmd+k');
      hotkeys.unbind('ctrl+p,cmd+p');
      hotkeys.unbind('ctrl+o,cmd+o');
      hotkeys.unbind('ctrl+s,cmd+s');
    };
  }, [content, activeFileHandle]);

  const handleInsert = (type: string) => {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const selection = view.state.selection.main;
    const start = selection.from;
    const end = selection.to;
    
    const selectedText = view.state.sliceDoc(start, end);
    let newContent = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        newContent = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? newContent.length : 2;
        break;
      case 'italic':
        newContent = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? newContent.length : 1;
        break;
      case 'h1':
        newContent = `\n# ${selectedText || 'Heading 1'}\n`;
        cursorOffset = newContent.length;
        break;
      case 'h2':
        newContent = `\n## ${selectedText || 'Heading 2'}\n`;
        cursorOffset = newContent.length;
        break;
      case 'list':
        newContent = `\n- ${selectedText || 'List item'}\n`;
        cursorOffset = newContent.length;
        break;
      case 'link':
        newContent = `[${selectedText || 'link text'}](https://)`;
        cursorOffset = selectedText ? newContent.length : 1;
        break;
      case 'image':
        newContent = `![${selectedText || 'alt text'}](https://)`;
        cursorOffset = selectedText ? newContent.length : 2;
        break;
      case 'code':
        newContent = `\`\`\`javascript\n${selectedText || 'code'}\n\`\`\``;
        cursorOffset = newContent.length;
        break;
    }

    view.dispatch({
      changes: { from: start, to: end, insert: newContent },
      selection: { anchor: start + cursorOffset }
    });
    view.focus();
  };

  // Sync scroll logic
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (scrollingSourceRef.current && scrollingSourceRef.current !== 'editor') return;
    scrollingSourceRef.current = 'editor';

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const targetDiv = previewRef.current?.querySelector('.minimal-scrollbar') as HTMLDivElement | null;
    if (targetDiv) {
      const percentage = scrollTop / (scrollHeight - clientHeight);
      targetDiv.scrollTop = percentage * (targetDiv.scrollHeight - targetDiv.clientHeight);
    }
    
    setTimeout(() => { scrollingSourceRef.current = null; }, 50);
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollingSourceRef.current && scrollingSourceRef.current !== 'preview') return;
    scrollingSourceRef.current = 'preview';

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const editorScroller = editorRef.current?.view?.scrollDOM;
    if (editorScroller) {
      const percentage = scrollTop / (scrollHeight - clientHeight);
      editorScroller.scrollTop = percentage * (editorScroller.scrollHeight - editorScroller.clientHeight);
    }
    
    setTimeout(() => { scrollingSourceRef.current = null; }, 50);
  };

  useEffect(() => {
    if (activeDocumentId) {
      setOpenDocuments(prev => prev.map(document => (
        document.id === activeDocumentId ? { ...document, content } : document
      )));
    }
  }, [content, activeDocumentId]);

  useEffect(() => {
    if (!activeDocumentName) {
      localStorage.setItem('novamd-content', content);
    }
  }, [content, activeDocumentName]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('novamd-theme-preset', themePreset);
  }, [themePreset]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      updateContent('');
    }
  };

  return (
    <div
      data-theme={themePreset}
      className="app-shell h-screen w-full flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 overflow-hidden selection:bg-indigo-500/20 transition-colors duration-500"
      onDragOver={handleAppDragOver}
      onDrop={handleAppDrop}
    >
      <nav className="app-nav h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-950 shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? "Hide document panel" : "Show document panel"}
            className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-xl"
          >
            {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)]"
          >
            N
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-[13px] font-black tracking-tight leading-none mb-1 uppercase">
              {activeDocumentName || 'NovaMD Editor'}
            </h1>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-all",
                isSaving ? "bg-indigo-50 text-indigo-500 animate-pulse" : 
                (activeDocumentName ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" : "bg-slate-50 dark:bg-slate-900 text-slate-400")
              )}>
                {isSaving ? <CheckCircle2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                {isSaving ? 'Saving...' : (activeFileHandle ? 'Disk Connected' : activeDocumentName ? 'Document Loaded' : 'Draft Mode')}
              </span>
            </div>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={handleNewDocument}
              title="New document"
              className="grid h-8 w-8 place-items-center rounded-xl text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            >
              <FilePlus2 size={17} />
            </button>
            <input
              id="markdown-file-input"
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.mdown,.txt,text/markdown,text/plain"
              multiple
              onChange={handleFileInputChange}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
            <label
              htmlFor="markdown-file-input"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm active:scale-90 select-none dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              title="Open document (Ctrl+O)"
            >
              <FileText size={17} />
            </label>
            <button 
              type="button"
              onClick={handleLocalSave}
              title={activeFileHandle ? "Save (Ctrl+S)" : "Save as (Ctrl+S)"}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-xl transition-all hover:bg-white hover:shadow-sm active:scale-90 dark:hover:bg-slate-800",
                isSaving ? "text-indigo-600" : "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              )}
            >
              <Save size={17} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'edit', icon: Type, label: 'Writer' },
            { id: 'split', icon: Columns, label: 'Split' },
            { id: 'preview', icon: Eye, label: 'Preview' }
          ].map((mode) => (
            <button 
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              title={`Switch to ${mode.label} view`}
              className={cn(
                "px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2",
                viewMode === mode.id 
                  ? "bg-white dark:bg-slate-800 shadow-xl shadow-black/5 text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <mode.icon size={14} />
              <span className="hidden md:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1 sm:visible">
            <button 
              onClick={handleExportMarkdown}
              title="Download Markdown"
              className="p-2 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={handleExportHTML}
              title="Export HTML"
              className="p-2 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            >
              <FileJson size={18} />
            </button>
            <button 
              onClick={handleExportPDF}
              title="Print PDF"
              className="p-2 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            >
              <Printer size={18} />
            </button>
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
            <button 
              onClick={() => { const p = undo(); if(p !== null) updateContent(p); }} 
              disabled={!canUndo}
              title="Undo"
              className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all active:scale-90"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={() => { const n = redo(); if(n !== null) updateContent(n); }} 
              disabled={!canRedo}
              title="Redo"
              className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all active:scale-90"
            >
              <RotateCw size={18} />
            </button>
          </div>
          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-2 py-1 dark:bg-slate-900/60" title="Theme preset">
            <Palette size={15} className="text-slate-400" />
            <select
              value={themePreset}
              onChange={(event) => setThemePreset(event.target.value as ThemePreset)}
              className="theme-select bg-transparent text-[11px] font-bold uppercase tracking-wider text-slate-500 outline-none dark:text-slate-300"
              aria-label="Theme preset"
            >
              {THEME_PRESETS.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.label}</option>
              ))}
            </select>
          </div>
          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:rotate-12"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={handleClear}
            title="Clear editor content"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </nav>

      <div className="flex-grow flex overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="side-panel h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden flex flex-col"
            >
              <div className="h-10 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Documents</span>
                <span className="text-[10px] font-black text-slate-400">{openDocuments.length}</span>
              </div>
              <div className="minimal-scrollbar flex-1 overflow-y-auto p-3">
                {openDocuments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs font-semibold text-slate-400 dark:border-slate-800">
                    No documents opened
                  </div>
                ) : (
                  <div className="space-y-1">
                    {openDocuments.map((document) => {
                      const isActive = document.id === activeDocumentId;
                      return (
                        <button
                          key={document.id}
                          type="button"
                          onClick={() => activateDocument(document)}
                          title={`Switch to ${document.name}`}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all",
                            isActive
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                          )}
                        >
                          <FileText size={14} className={cn("shrink-0", isActive ? "text-white" : "text-indigo-500")} />
                          <span className="min-w-0 flex-1 truncate">{document.name}</span>
                          {!document.handle && (
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                              isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                            )}>
                              local
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout" initial={false}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <motion.div 
              key="editor"
              initial={{ x: -100, opacity: 0 }}
              animate={{ width: viewMode === 'split' ? "50%" : "100%", x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "editor-pane flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden h-full z-10",
                viewMode === 'split' ? "border-r border-slate-200 dark:border-slate-800" : ""
              )}
            >
              <div className="flex-grow overflow-hidden relative">
                <Editor 
                  value={content} 
                  onChange={updateContent} 
                  onScroll={handleEditorScroll}
                  onSave={handleLocalSave}
                  editorRef={editorRef}
                  isDarkMode={isDarkMode}
                />
              </div>
            </motion.div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <motion.div 
              key="preview"
              initial={{ x: 100, opacity: 0 }}
              animate={{ width: viewMode === 'split' ? "50%" : "100%", x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              ref={previewRef}
              className="preview-pane flex bg-white dark:bg-slate-950 overflow-hidden h-full"
            >
              <div className="flex-grow overflow-hidden flex flex-col">
                <Preview 
                  content={content} 
                  onScroll={handlePreviewScroll} 
                  isDarkMode={isDarkMode}
                />
              </div>
              <TableOfContents content={content} onItemClick={handleJumpToSection} />
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode !== 'preview' && (
          <FloatingToolbar onInsert={handleInsert} />
        )}
      </div>

      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-12 left-1/2 z-[80] -translate-x-1/2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-xl shadow-indigo-500/10 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-300"
          >
            保存成功
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="app-footer h-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center space-x-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
          <span>{(content || '').split(/\s+/).filter(Boolean).length} WORDS</span>
          <span>{(content || '').length} CHARS</span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group cursor-default">
          <FileCode2 size={12} className="text-indigo-500 group-hover:scale-110 transition-transform" />
          <span>NovaMD v1.2</span>
        </div>
      </footer>
    </div>
  );
}
