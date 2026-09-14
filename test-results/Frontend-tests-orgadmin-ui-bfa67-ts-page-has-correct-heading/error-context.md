# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Frontend\tests\orgadmin-ui.spec.ts >> Org Admin UI Flow >> Students Page >> students page has correct heading
- Location: Frontend\tests\orgadmin-ui.spec.ts:57:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Students' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Students' })

```

```yaml
- img "SchoolERP"
- paragraph: School Management System
- paragraph
- text: Branch office
- heading "Run your campus operations." [level=1]
- paragraph: Manage students, admissions, fees, staff and everyday school work from one dashboard.
- img
- text: Student records
- img
- text: Admissions & fees
- img
- text: Gate attendance
- img
- text: Live reports
- button "Staff" [pressed]:
  - img
  - text: Staff
- button "Parent":
  - img
  - text: Parent
- button "Student":
  - img
  - text: Student
- button "Admin":
  - img
  - text: Admin
- heading "Staff Portal" [level=2]
- paragraph: Sign in with your school code and the credentials shared by the office.
- text: School Code
- img
- textbox "e.g. GULSHAN-01"
- text: Email or Username*
- img
- textbox "you@example.com or username"
- text: Password*
- img
- textbox "••••••••"
- button "Show password":
  - img
- button "Sign in"
- link "Forgot password?":
  - /url: /forgot-password
- paragraph: Having trouble signing in? Contact your school office.
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE = 'http://localhost:3000';
  4   | 
  5   | async function waitForHydration(page: import('@playwright/test').Page) {
  6   |   await page.waitForLoadState('networkidle');
  7   |   await page.waitForTimeout(2000);
  8   | }
  9   | 
  10  | test.describe('Org Admin UI Flow', () => {
  11  |   test.describe('Login & Dashboard', () => {
  12  |     test('admin login with school code redirects to branch dashboard', async ({ browser }) => {
  13  |       const context = await browser.newContext();
  14  |       const page = await context.newPage();
  15  |       try {
  16  |         await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  17  |         // Wait for the hub form to hydrate instead of a fixed sleep
  18  |         await page.getByPlaceholder('you@example.com or username').waitFor({ state: 'visible', timeout: 20000 });
  19  | 
  20  |         await page.getByPlaceholder('e.g. GULSHAN-01').fill('DEMO-01');
  21  |         await page.getByPlaceholder('you@example.com or username').fill('admin.demo-01@seed.example.com');
  22  |         await page.getByPlaceholder('••••••••').fill('Admin@123');
  23  |         await page.getByRole('button', { name: 'Sign in' }).click();
  24  | 
  25  |         // First navigation compiles the dashboard route in dev — allow for it
  26  |         await page.waitForURL(/branch|dashboard/, { timeout: 45000 });
  27  |         expect(page.url()).toMatch(/branch|dashboard/);
  28  |       } finally {
  29  |         await context.close();
  30  |       }
  31  |     });
  32  | 
  33  |     test('dashboard loads without errors', async ({ page }) => {
  34  |       const errors: string[] = [];
  35  |       page.on('pageerror', (e) => errors.push(e.message));
  36  |       await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
  37  |       await waitForHydration(page);
  38  |       expect(errors).toEqual([]);
  39  |     });
  40  | 
  41  |     test('dashboard shows stats cards', async ({ page }) => {
  42  |       await page.goto(`${BASE}/branch/dashboard`);
  43  |       await waitForHydration(page);
  44  |       const body = await page.textContent('body');
  45  |       expect(body).toContain('Student');
  46  |     });
  47  |   });
  48  | 
  49  |   test.describe('Students Page', () => {
  50  |     test('students page loads', async ({ page }) => {
  51  |       await page.goto(`${BASE}/branch/students`);
  52  |       await waitForHydration(page);
  53  |       const body = await page.textContent('body');
  54  |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  55  |     });
  56  | 
  57  |     test('students page has correct heading', async ({ page }) => {
  58  |       await page.goto(`${BASE}/branch/students`);
  59  |       await waitForHydration(page);
> 60  |       await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  61  |     });
  62  | 
  63  |     test('students page has add/import/export actions', async ({ page }) => {
  64  |       await page.goto(`${BASE}/branch/students`);
  65  |       await waitForHydration(page);
  66  |       const body = await page.textContent('body');
  67  |       expect(body).toMatch(/Add|Import|Export/i);
  68  |     });
  69  |   });
  70  | 
  71  |   test.describe('Staff Page', () => {
  72  |     test('staff page loads', async ({ page }) => {
  73  |       await page.goto(`${BASE}/branch/staff`);
  74  |       await waitForHydration(page);
  75  |       const body = await page.textContent('body');
  76  |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  77  |     });
  78  | 
  79  |     test('staff page has correct heading', async ({ page }) => {
  80  |       await page.goto(`${BASE}/branch/staff`);
  81  |       await waitForHydration(page);
  82  |       await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
  83  |     });
  84  | 
  85  |     test('staff page has add staff button', async ({ page }) => {
  86  |       await page.goto(`${BASE}/branch/staff`);
  87  |       await waitForHydration(page);
  88  |       const body = await page.textContent('body');
  89  |       expect(body).toMatch(/Add Staff|Add User|New Staff/i);
  90  |     });
  91  |   });
  92  | 
  93  |   test.describe('Academic Page', () => {
  94  |     test('academic page loads', async ({ page }) => {
  95  |       await page.goto(`${BASE}/branch/academic`);
  96  |       await waitForHydration(page);
  97  |       const body = await page.textContent('body');
  98  |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  99  |     });
  100 | 
  101 |     test('academic page shows step tabs', async ({ page }) => {
  102 |       await page.goto(`${BASE}/branch/academic`);
  103 |       await waitForHydration(page);
  104 |       await expect(page.getByRole('heading', { name: 'Academic Setup' })).toBeVisible();
  105 |       const body = await page.textContent('body');
  106 |       expect(body).toContain('Academic Year');
  107 |       expect(body).toContain('Classes');
  108 |       expect(body).toContain('Subjects');
  109 |     });
  110 |   });
  111 | 
  112 |   test.describe('Fee Structures Page', () => {
  113 |     test('fee structures page loads', async ({ page }) => {
  114 |       await page.goto(`${BASE}/branch/fees/structures`);
  115 |       await waitForHydration(page);
  116 |       const body = await page.textContent('body');
  117 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  118 |     });
  119 | 
  120 |     test('fee structures page has correct heading', async ({ page }) => {
  121 |       await page.goto(`${BASE}/branch/fees/structures`);
  122 |       await waitForHydration(page);
  123 |       await expect(page.getByRole('heading', { name: 'Fee Structures', exact: true })).toBeVisible();
  124 |     });
  125 |   });
  126 | 
  127 |   test.describe('Fee Records Page', () => {
  128 |     test('fee records page loads', async ({ page }) => {
  129 |       await page.goto(`${BASE}/branch/fees/records`);
  130 |       await waitForHydration(page);
  131 |       const body = await page.textContent('body');
  132 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  133 |     });
  134 |   });
  135 | 
  136 |   test.describe('Fee Collection Page', () => {
  137 |     test('fee collection page loads', async ({ page }) => {
  138 |       await page.goto(`${BASE}/branch/fees/collection`);
  139 |       await waitForHydration(page);
  140 |       const body = await page.textContent('body');
  141 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  142 |     });
  143 |   });
  144 | 
  145 |   test.describe('Attendance Pages', () => {
  146 |     test('attendance records page loads with tabs', async ({ page }) => {
  147 |       await page.goto(`${BASE}/branch/attendance/records`);
  148 |       await waitForHydration(page);
  149 |       await expect(page.getByText('Daily View')).toBeVisible();
  150 |       await expect(page.getByText('Monthly View')).toBeVisible();
  151 |     });
  152 | 
  153 |     test('live attendance page loads', async ({ page }) => {
  154 |       await page.goto(`${BASE}/branch/attendance/live`);
  155 |       await waitForHydration(page);
  156 |       const body = await page.textContent('body');
  157 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  158 |     });
  159 | 
  160 |     test('gate scanner page loads', async ({ page }) => {
```