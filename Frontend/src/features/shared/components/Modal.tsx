'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const panelMotion = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.97 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/50 backdrop-blur-md pb-20 sm:pb-4"
          // Close only when the pointer starts on the backdrop. Using click here
          // makes selecting input text and releasing outside the panel dismiss it.
          onPointerDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            {...panelMotion}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              'bg-white shadow-2xl shadow-black/20 w-full flex flex-col',
              'max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh]',
              'rounded-3xl',
              'border border-gray-200/40 ring-1 ring-primary-900/[0.03]',
              {
                'max-w-md': size === 'sm',
                'max-w-lg': size === 'md',
                'max-w-3xl': size === 'lg',
                'max-w-4xl': size === 'xl',
              }
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-gray-100 bg-white shrink-0 rounded-t-3xl">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 pr-4 tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white p-1.5 -mr-1.5 rounded-xl transition-all duration-200 hover:rotate-90"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="min-h-0 px-5 sm:px-7 py-5 overflow-y-auto overscroll-contain flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
