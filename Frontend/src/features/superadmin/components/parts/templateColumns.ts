import type { ImportMode, TemplateColumn } from './types';

/**
 * Single source of truth for the import sheets. The guide table and the Excel
 * preview both read from here, so a column can never drift between the two.
 */
export const ORG_TEMPLATE_COLUMNS: readonly TemplateColumn[] = [
  { col: 'Name', required: true, example: 'Falcon Academy Systems' },
  { col: 'Code', required: true, example: 'FALCON-01' },
  { col: 'Slug', required: false, example: 'falcon-academy' },
  { col: 'LogoUrl', required: false, example: 'https://example.com/logo.png' },
  { col: 'AdminName', required: false, example: 'Mr. Ali Khan' },
  { col: 'AdminUsername', required: false, example: 'falcon_admin' },
  { col: 'AdminEmail', required: false, example: 'admin@falcon.edu' },
  { col: 'AdminPassword', required: false, example: 'Welcome@123' },
  { col: 'AdminPhone', required: false, example: '03001234567' },
];

const BRANCH_COLUMNS: Record<ImportMode, readonly TemplateColumn[]> = {
  specific: [
    { col: 'Name', required: true, example: 'Gulshan Campus' },
    { col: 'Code', required: true, example: 'GULSHAN-01' },
    { col: 'Address', required: false, example: 'Main Boulevard, Gulshan' },
    { col: 'Phone', required: false, example: '03001234567' },
    { col: 'AdminName', required: false, example: 'Mr. Ali Khan' },
    { col: 'AdminEmail', required: false, example: 'principal@gulshan.edu' },
  ],
  all: [
    { col: 'OrganizationCode', required: true, example: 'FALCON' },
    { col: 'Name', required: true, example: 'Gulshan Campus' },
    { col: 'Code', required: true, example: 'GULSHAN-01' },
    { col: 'Address', required: false, example: 'Main Boulevard, Gulshan' },
    { col: 'Phone', required: false, example: '03001234567' },
    { col: 'AdminName', required: false, example: 'Mr. Ali Khan' },
    { col: 'AdminEmail', required: false, example: 'principal@gulshan.edu' },
  ],
};

export function branchTemplateColumns(mode: ImportMode): readonly TemplateColumn[] {
  return BRANCH_COLUMNS[mode];
}