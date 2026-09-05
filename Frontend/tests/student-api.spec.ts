import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api/v1';

test.describe('Student Portal API Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('POST /auth/student/login returns token + student', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/student/login`, {
      data: { schoolCode: 'GULSHAN-01', rollNumber: '101', password: 'GULSHAN-01' },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.token).toBeTruthy();
    expect(json.data.student).toBeDefined();
    expect(json.data.student.rollNumber).toBeTruthy();
  });

  test('POST /auth/student/login with wrong password returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/student/login`, {
      data: { schoolCode: 'GULSHAN-01', rollNumber: '101', password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /auth/student/login with wrong school code returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/student/login`, {
      data: { schoolCode: 'WRONG-CODE', rollNumber: '101', password: 'GULSHAN-01' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /auth/student/me returns student profile', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('studentToken'));
    const res = await page.request.get(`${API}/auth/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.rollNumber).toBeTruthy();
  });

  test('GET /auth/student/me without token returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/auth/student/me`);
    expect(res.status()).toBe(401);
  });

  test('Student cannot access staff-only /auth/me', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('studentToken'));
    const res = await page.request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Student cannot access /organizations/overview', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('studentToken'));
    const res = await page.request.get(`${API}/organizations/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Student cannot access /audit-logs', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('studentToken'));
    const res = await page.request.get(`${API}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });
});
