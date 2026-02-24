import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearch?: () => void;
  onRefresh?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onRefresh }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K -> Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
      }
      // R -> Refresh (when not in input)
      if (e.key === 'r' && !isInputFocused()) {
        onRefresh?.();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSearch, onRefresh]);
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
}
