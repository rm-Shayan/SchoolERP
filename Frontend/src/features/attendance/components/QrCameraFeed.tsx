'use client';

import { memo } from 'react';
import { useQrScanner } from './parts/useQrScanner';

interface Props { onScan: (code: string) => void; isProcessing: boolean; dark?: boolean; }

export default memo(function QrCameraFeed({ onScan, isProcessing, dark = false }: Props) {
  const { containerId, isStarted, starting, error, start } = useQrScanner({ onScan });

  return (
    <div className={`relative rounded-xl overflow-hidden ${dark ? 'bg-black' : 'bg-slate-900'}`}>
      <div id={containerId} className="w-full min-h-[280px] max-h-[340px]" />

      {/* Scan frame overlay */}
      {isStarted && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-52 h-52 border-2 border-primary-400/80 rounded-2xl relative">
            <span className="absolute -top-px -left-px w-6 h-6 border-t-[3px] border-l-[3px] border-primary-400 rounded-tl-2xl" />
            <span className="absolute -top-px -right-px w-6 h-6 border-t-[3px] border-r-[3px] border-primary-400 rounded-tr-2xl" />
            <span className="absolute -bottom-px -left-px w-6 h-6 border-b-[3px] border-l-[3px] border-primary-400 rounded-bl-2xl" />
            <span className="absolute -bottom-px -right-px w-6 h-6 border-b-[3px] border-r-[3px] border-primary-400 rounded-br-2xl" />
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-2xl">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
            </div>
            {isProcessing && (
              <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                <div className="w-8 h-8 border-[3px] border-primary-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start button */}
      {!isStarted && !error && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm ${dark ? 'bg-black/80' : 'bg-slate-900/85'}`}>
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Ready to Scan</p>
            <p className="text-gray-400 text-xs mt-1">Point camera at student QR code</p>
          </div>
          <button onClick={start} disabled={starting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-primary-600/20">
            {starting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            Start Camera
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/95 backdrop-blur-sm p-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-gray-300 text-center max-w-xs leading-relaxed">{error}</p>
          <button onClick={start} disabled={starting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-all">
            {starting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            Retry Camera
          </button>
        </div>
      )}

      {/* Live indicator */}
      {isStarted && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider">Live</span>
        </div>
      )}
    </div>
  );
})
