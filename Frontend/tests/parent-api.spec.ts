import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api/v1';

test.describe('Parent Portal API Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('POST /auth/parent/login returns token + parent', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/parent/login`, {
      data: { schoolCode: 'GULSHAN-01', phone: '0317-7777777', password: 'GULSHAN-01' },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.token).toBeTruthy();
    expect(json.data.parent).toBeDefined();
    expect(json.data.parent.name).toBeTruthy();
  });

  test('POST /auth/parent/login with wrong password returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/parent/login`, {
      data: { schoolCode: 'GULSHAN-01', phone: '0317-7777777', password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /auth/parent/login with wrong phone returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/parent/login`, {
      data: { schoolCode: 'GULSHAN-01', phone: '0399-9999999', password: 'GULSHAN-01' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /auth/parent/login with wrong school code returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/auth/parent/login`, {
      data: { schoolCode: 'WRONG-CODE', phone: '0317-7777777', password: 'GULSHAN-01' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /auth/parent/me returns parent profile', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('parentToken'));
    const res = await page.request.get(`${API}/auth/parent/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.name).toBeTruthy();
    expect(json.data.children).toBeDefined();
  });

  test('GET /auth/parent/me without token returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/auth/parent/me`);
    expect(res.status()).toBe(401);
  });

  test('Parent cannot access staff-only /auth/me', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('parentToken'));
    const res = await page.request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Parent cannot access /organizations/overview', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('parentToken'));
    const res = await page.request.get(`${API}/organizations/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Parent cannot access /audit-logs', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('parentToken'));
    const res = await page.request.get(`${API}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status());
  });
});
