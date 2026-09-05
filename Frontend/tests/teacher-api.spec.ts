import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api/v1';

test.describe('Teacher API Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('auth/me returns teacher profile', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.role).toBe('TEACHER');
    expect(json.data.schoolId).toBeTruthy();
  });

  test('auth/me without token returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('GET /academic/schools/:id/classes returns classes for teacher school', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const schoolId = user.schoolId;
    const res = await page.request.get(`${API}/academic/schools/${schoolId}/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  test('Teacher cannot access GET /fees/structures', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/fees/structures`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Teacher cannot access GET /fees/records', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/fees/records`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('GET /attendance/daily returns daily attendance', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/attendance/daily`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  test('Teacher cannot access GET /attendance/monthly', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/attendance/monthly`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
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

  test('Teacher cannot access /organizations/overview (super-admin only)', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/organizations/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('Teacher cannot access /students/platform (super-admin only)', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/students/platform`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('Teacher cannot access /auth/users/directory (admin only)', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/auth/users/directory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Teacher cannot access /auth/users/unassigned-admins', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/auth/users/unassigned-admins`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Teacher cannot access /audit-logs', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${API}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Teacher cannot create school', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.post(`${API}/schools`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Test School' },
    });
    expect([401, 403]).toContain(res.status());
  });
});
