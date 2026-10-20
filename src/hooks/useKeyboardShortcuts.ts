import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onCompile?: () => void;
  onCommandPalette?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSyncToPdf?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlers.onSave?.();
      } else if (isMod && e.altKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        handlers.onSyncToPdf?.();
      } else if (isMod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handlers.onCompile?.();
      } else if (isMod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlers.onCommandPalette?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
