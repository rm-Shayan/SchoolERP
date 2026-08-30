'use client';

import { memo } from 'react';

interface Props {
  undoCount: number;
  onUndoAll: () => void;
}

const KeyboardHints = memo(function KeyboardHints({ undoCount, onUndoAll }: Props) {
  const kbd = (label: string) => (
    <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-gray-500">{label}</kbd>
  );

  return (
    <>
      <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
        {kbd('↑↓')} navigate
        {kbd('1')}P {kbd('2')}L {kbd('3')}A {kbd('4')}LV
        <span className="text-gray-300">│</span>
        {kbd('Ctrl+Z')} undo
      </div>
      {undoCount > 0 && (
        <button onClick={onUndoAll} className="mt-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
          ↩ Undo all {undoCount} change{undoCount > 1 ? 's' : ''}
        </button>
      )}
    </>
  );
});

export default KeyboardHints;
