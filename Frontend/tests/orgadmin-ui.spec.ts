import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function waitForHydration(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Org Admin UI Flow', () => {
  test.describe('Login & Dashboard', () => {
    test('admin login with school code redirects to branch dashboard', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await page.goto(`${BASE}/login`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await page.getByPlaceholder('e.g. GULSHAN-01').fill('GULSHAN-01');
        await page.getByPlaceholder('you@example.com or username').fill('admin@falconacademy.com');
        await page.getByPlaceholder('••••••••').fill('admin123');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await page.waitForURL(/branch|dashboard/, { timeout: 15000 });
        expect(page.url()).toMatch(/branch|dashboard/);
      } finally {
        await context.close();
      }
    });

    test('dashboard loads without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
      await waitForHydration(page);
      expect(errors).toEqual([]);
    });

    test('dashboard shows stats cards', async ({ page }) => {
      await page.goto(`${BASE}/branch/dashboard`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).toContain('Student');
    });
  });

  test.describe('Students Page', () => {
    test('students page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/students`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });

    test('students page has correct heading', async ({ page }) => {
      await page.goto(`${BASE}/branch/students`);
      await waitForHydration(page);
      await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
    });

    test('students page has add/import/export actions', async ({ page }) => {
      await page.goto(`${BASE}/branch/students`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).toMatch(/Add|Import|Export/i);
    });
  });

  test.describe('Staff Page', () => {
    test('staff page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/staff`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });

    test('staff page has correct heading', async ({ page }) => {
      await page.goto(`${BASE}/branch/staff`);
      await waitForHydration(page);
      await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
    });

    test('staff page has add staff button', async ({ page }) => {
      await page.goto(`${BASE}/branch/staff`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).toMatch(/Add Staff|Add User|New Staff/i);
    });
  });

  test.describe('Academic Page', () => {
    test('academic page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/academic`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });

    test('academic page shows step tabs', async ({ page }) => {
      await page.goto(`${BASE}/branch/academic`);
      await waitForHydration(page);
      await expect(page.getByRole('heading', { name: 'Academic Setup' })).toBeVisible();
      const body = await page.textContent('body');
      expect(body).toContain('Academic Year');
      expect(body).toContain('Classes');
      expect(body).toContain('Subjects');
    });
  });

  test.describe('Fee Structures Page', () => {
    test('fee structures page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/fees/structures`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });

    test('fee structures page has correct heading', async ({ page }) => {
      await page.goto(`${BASE}/branch/fees/structures`);
      await waitForHydration(page);
      await expect(page.getByRole('heading', { name: 'Fee Structures', exact: true })).toBeVisible();
    });
  });

  test.describe('Fee Records Page', () => {
    test('fee records page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/fees/records`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });
  });

  test.describe('Fee Collection Page', () => {
    test('fee collection page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/fees/collection`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });
  });

  test.describe('Attendance Pages', () => {
    test('attendance records page loads with tabs', async ({ page }) => {
      await page.goto(`${BASE}/branch/attendance/records`);
      await waitForHydration(page);
      await expect(page.getByText('Daily View')).toBeVisible();
      await expect(page.getByText('Monthly View')).toBeVisible();
    });

    test('live attendance page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/attendance/live`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });

    test('gate scanner page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/attendance/gate`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).not.toMatch(/TypeError|Cannot read properties/i);
    });
  });

  test.describe('Admissions Page', () => {
    test('admissions page loads', async ({ page }) => {
      await page.goto(`${BASE}/branch/admissions`);
      await waitForHydration(page);
      await expect(page.getByRole('heading', { name: 'Admissions' })).toBeVisible();
    });

    test('admissions page has new inquiry button', async ({ page }) => {
      await page.goto(`${BASE}/branch/admissions`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).toContain('New Inquiry');
    });
  });

  test.describe('Settings Page', () => {
    test('settings page loads with tabs', async ({ page }) => {
      await page.goto(`${BASE}/branch/settings`);
      await waitForHydration(page);
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      const body = await page.textContent('body');
      expect(body).toContain('My Profile');
      expect(body).toContain('Change Password');
    });

    test('settings page has branch profile tab', async ({ page }) => {
      await page.goto(`${BASE}/branch/settings`);
      await waitForHydration(page);
      const body = await page.textContent('body');
      expect(body).toContain('Branch Profile');
    });
  });

  test.describe('Other Pages Load Without Errors', () => {
    const pages = [
      { path: '/branch/homework', name: 'Homework' },
      { path: '/branch/timetable', name: 'Timetable' },
      { path: '/branch/exams', name: 'Exams' },
      { path: '/branch/exams/results', name: 'Exam Results' },
      { path: '/branch/promotions', name: 'Promotions' },
      { path: '/branch/leave', name: 'Leave' },
      { path: '/branch/conduct', name: 'Conduct' },
      { path: '/branch/ptm', name: 'PTM' },
      { path: '/branch/study-material', name: 'Study Material' },
      { path: '/branch/announcements/circulars', name: 'Announcements' },
      { path: '/branch/notifications', name: 'Notifications' },
    ];

    for (const p of pages) {
      test(`${p.name} page loads without errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' });
        await waitForHydration(page);
        expect(errors).toEqual([]);
      });
    }
  });

  test.describe('Navigation Flow', () => {
    test('sidebar links all work without errors', async ({ page }) => {
      test.setTimeout(90000);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      const pages = [
        '/branch/dashboard',
        '/branch/students',
        '/branch/staff',
        '/branch/academic',
        '/branch/fees/structures',
        '/branch/attendance/records',
        '/branch/settings',
      ];

      for (const path of pages) {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        const body = await page.textContent('body');
        expect(body).not.toMatch(/TypeError|Cannot read properties/i);
      }
      expect(errors).toEqual([]);
    });
  });

  test.describe('Responsive', () => {
    test('mobile viewport renders without errors', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
      await waitForHydration(page);
      expect(errors).toEqual([]);
    });

    test('tablet viewport renders without errors', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
      await waitForHydration(page);
      expect(errors).toEqual([]);
    });
  });
});
