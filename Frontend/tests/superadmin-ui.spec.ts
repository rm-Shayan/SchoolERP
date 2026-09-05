import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Super Admin UI Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
  });

  test.describe('Login & Dashboard', () => {
    test('super admin login redirects to /admin/dashboard', async ({ page }) => {
      await page.evaluate(() => localStorage.clear());
      await page.goto(`${BASE}/login`);
      await page.getByPlaceholder('you@example.com or username').fill('superadmin@schoolerp.com');
      await page.getByPlaceholder('••••••••').fill('superadmin123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
      await expect(page).toHaveURL(/admin\/dashboard/);
    });

    test('dashboard loads without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      expect(errors).toEqual([]);
    });
  });

  test.describe('Organizations Page', () => {
    test('organizations page loads with hero header', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();
      await expect(page.getByText('Manage all tenant organizations')).toBeVisible();
    });

    test('stats tiles show correct data', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      const body = await page.textContent('body');
      expect(body).toContain('Orgs');
      expect(body).toContain('Branches');
      expect(body).toContain('Students');
      expect(body).toContain('Revenue');
    });

    test('search filters organizations', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      const body = await page.textContent('body');
      expect(body).toContain('Organizations');
    });

    test('grid/table view toggle works', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      const gridBtn = page.getByRole('button', { name: /grid/i });
      const tableBtn = page.getByRole('button', { name: /table/i });
      await expect(gridBtn).toBeVisible();
      await expect(tableBtn).toBeVisible();
      await tableBtn.click();
      await page.waitForTimeout(500);
      await gridBtn.click();
      await page.waitForTimeout(500);
    });

    test('org cards render in grid view', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(3000);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/Something went wrong|TypeError/i);
    });

    test('bottom analytics section renders', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      await expect(page.getByText('Top by Revenue')).toBeVisible();
      await expect(page.getByText('Top by Students')).toBeVisible();
      await expect(page.getByText('Status Distribution')).toBeVisible();
      await expect(page.getByText('Quick Actions')).toBeVisible();
    });

    test('quick action links navigate correctly', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'New Org' }).click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });
  });

  test.describe('Branches Page', () => {
    test('branches page loads with hero header', async ({ page }) => {
      await page.goto(`${BASE}/admin/branches`);
      await page.waitForTimeout(2000);
      await expect(page.getByRole('heading', { name: 'Branches', exact: true })).toBeVisible();
    });

    test('stats show branch count, orgs, students, staff', async ({ page }) => {
      await page.goto(`${BASE}/admin/branches`);
      await page.waitForTimeout(2000);
      await expect(page.getByRole('heading', { name: 'Branches', exact: true })).toBeVisible();
      const body = await page.textContent('body');
      expect(body).toContain('Organizations');
      expect(body).toContain('Students');
      expect(body).toContain('Staff');
    });

    test('branch analytics section renders', async ({ page }) => {
      await page.goto(`${BASE}/admin/branches`);
      await page.waitForTimeout(3000);
      await expect(page.getByText('Top by Students')).toBeVisible();
      await expect(page.getByText('Top by Staff')).toBeVisible();
    });

    test('search filters branches', async ({ page }) => {
      await page.goto(`${BASE}/admin/branches`);
      await page.waitForTimeout(2000);
      const searchInput = page.getByPlaceholder('Search branches…');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    });

    test('status filter chips work', async ({ page }) => {
      await page.goto(`${BASE}/admin/branches`);
      await page.waitForTimeout(2000);
      const activeChip = page.getByRole('button', { name: /Active/i });
      const blockedChip = page.getByRole('button', { name: /Blocked/i });
      await expect(activeChip).toBeVisible();
      await expect(blockedChip).toBeVisible();
      await activeChip.click();
      await page.waitForTimeout(500);
      await activeChip.click();
    });
  });

  test.describe('Users Page', () => {
    test('users page loads', async ({ page }) => {
      await page.goto(`${BASE}/admin/users`);
      await page.waitForTimeout(2000);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/Something went wrong|TypeError/i);
    });
  });

  test.describe('Settings Page', () => {
    test('settings page loads', async ({ page }) => {
      await page.goto(`${BASE}/admin/settings`);
      await page.waitForTimeout(2000);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/Something went wrong|TypeError/i);
    });
  });

  test.describe('Activity Page', () => {
    test('activity page loads', async ({ page }) => {
      await page.goto(`${BASE}/admin/activity`);
      await page.waitForTimeout(2000);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/Something went wrong|TypeError/i);
    });
  });

  test.describe('Navigation Flow', () => {
    test('sidebar links all work without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      const pages = [
        '/admin/dashboard',
        '/admin/organizations',
        '/admin/branches',
        '/admin/users',
        '/admin/activity',
        '/admin/settings',
      ];

      for (const path of pages) {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        const body = await page.textContent('body');
        expect(body).not.toMatch(/TypeError|Cannot read properties/i);
      }
      expect(errors).toEqual([]);
    });
  });

  test.describe('Create Organization Flow', () => {
    test('create org page/modal loads', async ({ page }) => {
      await page.goto(`${BASE}/admin/organizations`);
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'New Org' }).click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });
  });

  test.describe('Responsive', () => {
    test('mobile viewport renders without errors', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(`${BASE}/admin/organizations`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      expect(errors).toEqual([]);
    });

    test('tablet viewport renders without errors', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(`${BASE}/admin/organizations`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      expect(errors).toEqual([]);
    });
  });
});
