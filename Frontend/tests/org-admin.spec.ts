import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

const PAGES: { name: string; path: string }[] = [
  { name: 'Dashboard', path: '/o/iqra/branch/dashboard' },
  { name: 'Students', path: '/o/iqra/branch/students' },
  { name: 'Staff', path: '/o/iqra/branch/staff' },
  { name: 'Admissions', path: '/o/iqra/branch/admissions' },
  { name: 'Academic', path: '/o/iqra/branch/academic' },
  { name: 'Fees Structures', path: '/o/iqra/branch/fees/structures' },
  { name: 'Fees Records', path: '/o/iqra/branch/fees/records' },
  { name: 'Exams', path: '/o/iqra/branch/exams' },
  { name: 'Attendance Live', path: '/o/iqra/branch/attendance/live' },
  { name: 'PTM', path: '/o/iqra/branch/ptm' },
  { name: 'Promotions', path: '/o/iqra/branch/promotions' },
  { name: 'Announcements', path: '/o/iqra/branch/announcements/circulars' },
  { name: 'Settings', path: '/o/iqra/branch/settings' },
];

test('staff login with credentials redirects to branch dashboard', async ({ page }) => {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('e.g. GULSHAN-01').fill('iqra-01');
  await page.getByPlaceholder('you@example.com or username').fill('areesharao9@gmail.com');
  await page.getByPlaceholder('••••••••').fill('iqra');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/o/iqra/branch/dashboard', { timeout: 20000 });
  await expect(page).toHaveURL(/o\/iqra\/branch\/dashboard/);
  await expect(page.getByText(/Iqra Riaz Ul Atfal/i).first()).toBeVisible();
});

for (const p of PAGES) {
  test(`page loads without error: ${p.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/Something went wrong|TypeError|Cannot read properties/i);
    expect(errors).toEqual([]);
  });
}

test('API flow: /auth/me returns admin profile', async ({ page }) => {
  await page.goto(BASE);
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  const res = await page.request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.data.role).toBe('ADMIN');
  expect(json.data.organization.slug).toBe('iqra');
});

test('API flow: branch students list loads', async ({ page }) => {
  await page.goto(BASE);
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  const res = await page.request.get(`${API}/students?schoolId=1ff1c26d-af85-4d38-bcb6-3e6ffd2eee11`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
});

test('API flow: branch (school) detail loads for ADMIN', async ({ page }) => {
  await page.goto(BASE);
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  const res = await page.request.get(`${API}/schools/1ff1c26d-af85-4d38-bcb6-3e6ffd2eee11`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
});

test('Leave hub: tab switch between Staff and Student leave', async ({ page }) => {
  await page.goto(`${BASE}/o/iqra/branch/leave`);
  await expect(page.getByRole('button', { name: 'Staff Leave' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Student Leave' })).toBeVisible();
  await page.getByRole('button', { name: 'Student Leave' }).click();
  await page.waitForTimeout(800);
  await expect(page.getByRole('heading', { name: 'Student Leave Approvals' })).toBeVisible();
});

test('Attendance Records hub: tab switch Student/Staff', async ({ page }) => {
  await page.goto(`${BASE}/o/iqra/branch/attendance/records`);
  await expect(page.getByRole('button', { name: 'Student Records' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Staff Records' })).toBeVisible();
  await page.getByRole('button', { name: 'Staff Records' }).click();
  await page.waitForTimeout(800);
  await expect(page.getByRole('heading', { name: 'Staff Attendance' })).toBeVisible();
});

test('Staff list: clicking a row opens detail drawer with Profile/Scan/Leaves tabs', async ({ page }) => {
  await page.goto(`${BASE}/o/iqra/branch/staff`);
  await page.waitForTimeout(1200);
  await page.locator('table tbody tr').first().click();
  await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan Attendance' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leaves' })).toBeVisible();
});

test('Sidebar: redundant pages merged (no Staff ID Cards / Scan Check-in / Staff Attendance)', async ({ page }) => {
  await page.goto(`${BASE}/o/iqra/branch/dashboard`);
  await page.waitForTimeout(800);
  await expect(page.getByRole('link', { name: 'Staff ID Cards' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Scan Check-in' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Staff Attendance' })).toHaveCount(0);
});

test('Student portal: login opens unified dashboard + slug auto-fills', async ({ page }) => {
  await page.goto(`${BASE}/parent/login`);
  await page.getByRole('button', { name: 'Student (Roll No)' }).click();
  await page.getByPlaceholder('e.g. GULSHAN-01').fill('iqra-01');
  await expect(page.getByText('School slug:')).toBeVisible();
  await page.getByPlaceholder('e.g. 104').fill('101');
  await page.getByPlaceholder('••••••••').fill('iqra');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/parent/dashboard');
  await expect(page.getByText('Student Portal', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Overview' }).first()).toBeVisible();
});
