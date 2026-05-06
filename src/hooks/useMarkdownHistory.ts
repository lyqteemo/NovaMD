import { useState, useCallback, useEffect } from 'react';

export function useMarkdownHistory(initialValue: string) {
  const [state, setState] = useState(() => ({
    history: [initialValue ?? ''],
    index: 0
  }));

  const updateContent = useCallback((newContent: string) => {
    setState(prev => {
      const safeContent = newContent ?? '';
      const currentContent = prev.history[prev.index] ?? '';
      if (currentContent === safeContent) return prev;

      const nextHistory = prev.history.slice(0, prev.index + 1);
      const newHistory = [...nextHistory, newContent];
      if (newHistory.length > 50) newHistory.shift();

      return {
        history: newHistory,
        index: newHistory.length - 1
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (state.index > 0) {
      const nextIndex = state.index - 1;
      setState(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }));
      return state.history[nextIndex] ?? '';
    }
    return null;
  }, [state]);

  const redo = useCallback(() => {
    if (state.index < state.history.length - 1) {
      const nextIndex = state.index + 1;
      setState(prev => ({ ...prev, index: Math.min(prev.index + 1, prev.history.length - 1) }));
      return state.history[nextIndex] ?? '';
    }
    return null;
  }, [state]);

  const content = state.history[state.index] ?? '';

  return {
    content,
    updateContent,
    undo,
    redo,
    canUndo: state.index > 0,
    canRedo: state.index < state.history.length - 1
  };
}
