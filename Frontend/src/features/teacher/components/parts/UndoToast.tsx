'use client';

import { memo, useEffect, useRef, useState } from 'react';

interface UndoToastProps {
  message: string | null;
  onDismiss: () => void;
}

const UndoToast = memo(function UndoToast({ message, onDismiss }: UndoToastProps) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message) {
      setShow(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { setShow(false); onDismiss(); }, 2500);
    } else {
      setShow(false);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [message, onDismiss]);

  if (!show || !message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm shadow-xl animate-in fade-in slide-in-from-bottom-2">
        <span>{message}</span>
        <button onClick={() => { setShow(false); onDismiss(); }} className="text-gray-400 hover:text-white text-xs">✕</button>
      </div>
    </div>
  );
});

export default UndoToast;
