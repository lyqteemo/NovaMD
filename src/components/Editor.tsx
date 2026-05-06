import React, { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onScroll: (e: any) => void;
  onSave: () => void;
  isDarkMode: boolean;
  editorRef: React.RefObject<ReactCodeMirrorRef | null>;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, onScroll, onSave, isDarkMode, editorRef }) => {
  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file && editorRef.current?.view) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imageMarkdown = `\n![Image](${base64})\n`;
            const view = editorRef.current!.view!;
            const pos = view.state.selection.main.head;
            view.dispatch({
              changes: { from: pos, insert: imageMarkdown },
              selection: { anchor: pos + imageMarkdown.length }
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const files = e.dataTransfer.files;
    const file = files[0];
    if (!file || file.name.toLowerCase().endsWith('.md')) return;
    if (file.type.indexOf('image') === -1 || !editorRef.current?.view) return;

    e.preventDefault();
    e.stopPropagation();

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const imageMarkdown = `\n![Image](${base64})\n`;
      const view = editorRef.current!.view!;
      const pos = view.state.selection.main.head;
      view.dispatch({
        changes: { from: pos, insert: imageMarkdown },
        selection: { anchor: pos + imageMarkdown.length }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className="h-full w-full overflow-hidden flex flex-col"
      onPaste={handlePaste}
      onDrop={handleDrop}
    >
      <CodeMirror
        ref={editorRef}
        value={value}
        height="100%"
        theme={isDarkMode ? 'dark' : 'light'}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          EditorView.lineWrapping,
          EditorView.domEventHandlers({
            keydown(event) {
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                onSave();
                return true;
              }
              return false;
            }
          }),
          EditorView.theme({
            "&": {
              height: "100%",
              fontSize: "14px",
              color: isDarkMode ? "#e2e8f0" : "#1e293b"
            },
            "&.cm-editor": {
              height: "100%",
              backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc"
            },
            ".cm-scroller": { 
              overflow: "auto", 
              fontFamily: "var(--font-mono)",
              backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
              scrollbarWidth: "thin",
              scrollbarColor: isDarkMode ? "rgba(129, 140, 248, 0.55) transparent" : "rgba(99, 102, 241, 0.45) transparent",
            },
            ".cm-content": { 
              padding: "64px !important",
              lineHeight: "2",
              maxWidth: "1000px",
              margin: "0 auto",
              minHeight: "100%",
              color: isDarkMode ? "#e2e8f0" : "#1e293b"
            },
            ".cm-line": {
              color: isDarkMode ? "#e2e8f0" : "#1e293b"
            },
            ".cm-gutters": { display: "none" },
            "&.cm-focused": { outline: "none" },
            ".cm-activeLine": { backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
            ".cm-selectionBackground": { backgroundColor: "rgba(79, 70, 229, 0.2) !important" }
          })
        ]}
        onChange={handleChange}
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          onScroll({
            currentTarget: {
              scrollTop: target.scrollTop,
              scrollHeight: target.scrollHeight,
              clientHeight: target.clientHeight
            }
          });
        }}
        className="h-full w-full"
      />
    </div>
  );
};
