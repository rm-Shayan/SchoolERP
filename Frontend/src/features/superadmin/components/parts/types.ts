export type ImportTab = 'organizations' | 'branches';

export type ImportMode = 'specific' | 'all';

export interface ProgressState {
  phase: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  current?: number;
  total?: number;
  percent?: number;
  error?: string;
  stalled?: boolean;
}

/** One column of the import sheet, shared by the guide table and the sheet preview. */
export interface TemplateColumn {
  col: string;
  required: boolean;
  example: string;
}