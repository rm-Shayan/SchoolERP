import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api/v1';
const BASE = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE);
});

test.describe('Super Admin API Flow', () => {
  test('auth/me returns super admin profile', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.role).toBe('SUPER_ADMIN');
    expect(json.data.email).toBe('superadmin@schoolerp.com');
  });

  test('GET /organizations returns list of orgs', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  test('GET /organizations/overview returns stats + org list', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/organizations/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.stats).toBeDefined();
    expect(json.data.stats.totalOrganizations).toBeGreaterThanOrEqual(0);
    expect(json.data.organizations).toBeDefined();
    expect(Array.isArray(json.data.organizations)).toBeTruthy();
  });

  test('GET /schools returns all branches', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/schools`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.items).toBeDefined();
    expect(json.data.total).toBeDefined();
  });

  test('GET /auth/users/directory returns staff directory', async ({ page }) => {
    test.setTimeout(60000);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/auth/users/directory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data.items)).toBeTruthy();
  });

  test('GET /auth/users/unassigned-admins returns unassigned admins', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/auth/users/unassigned-admins`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.items).toBeDefined();
    expect(json.data.total).toBeDefined();
  });

  test('GET /audit-logs returns audit trail', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  test('GET /notifications/portal returns notifications', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/notifications/portal`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  test('GET /organizations/export returns excel file', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/organizations/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const headers = res.headers();
    expect(headers['content-type']).toContain('spreadsheet');
  });

  test('GET /students/platform returns platform-wide students', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/students/platform`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('non-super-admin cannot access /organizations/overview', async ({ page }) => {
    // Try with no auth
    const res = await page.request.get(`${API}/organizations/overview`);
    expect(res.status()).toBe(401);
  });
});
