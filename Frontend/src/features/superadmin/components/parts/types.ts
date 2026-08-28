export type ImportTab = 'organizations' | 'branches';

export interface ProgressState {
  phase: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  current?: number;
  total?: number;
  percent?: number;
  error?: string;
  stalled?: boolean;
}
