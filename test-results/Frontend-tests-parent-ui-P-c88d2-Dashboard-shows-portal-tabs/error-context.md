# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Frontend\tests\parent-ui.spec.ts >> Parent Portal UI Flow >> Dashboard shows portal tabs
- Location: Frontend\tests\parent-ui.spec.ts:42:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - img "SchoolERP" [ref=e10]
        - generic [ref=e11]:
          - paragraph [ref=e12]: School Management System
          - paragraph
      - generic [ref=e13]: Branch office
      - heading "Run your campus operations." [level=1] [ref=e14]
      - paragraph [ref=e15]: Manage students, admissions, fees, staff and everyday school work from one dashboard.
      - generic [ref=e16]:
        - generic [ref=e17]: Student records
        - generic [ref=e20]: Admissions & fees
        - generic [ref=e23]: Gate attendance
        - generic [ref=e26]: Live reports
    - generic [ref=e30]:
      - generic [ref=e31]:
        - button "Staff" [pressed] [ref=e32]
        - button "Parent" [ref=e37]
        - button "Student" [ref=e42]
        - button "Admin" [ref=e47]
      - generic [ref=e53]:
        - generic [ref=e54]:
          - heading "Staff Portal" [level=2] [ref=e55]
          - paragraph [ref=e56]: Sign in with your school code and the credentials shared by the office.
        - generic [ref=e57]:
          - generic [ref=e58]:
            - generic [ref=e59]:
              - generic [ref=e60]: School Code
              - textbox "e.g. GULSHAN-01" [ref=e62]
            - generic [ref=e63]:
              - generic [ref=e64]: Email or Username*
              - textbox "you@example.com or username" [ref=e66]
            - generic [ref=e67]:
              - generic [ref=e68]: Password*
              - generic [ref=e69]:
                - textbox "••••••••" [ref=e70]
                - button "Show password" [ref=e72]
            - button "Sign in" [ref=e76]
          - link "Forgot password?" [ref=e78] [cursor=pointer]:
            - /url: /forgot-password
      - paragraph [ref=e80]: Having trouble signing in? Contact your school office.
  - button "Open Next.js Dev Tools" [ref=e86] [cursor=pointer]
  - alert [ref=e90]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = 'http://localhost:3000';
  4  | 
  5  | test.describe('Parent Portal UI Flow', () => {
  6  |   test.setTimeout(60000);
  7  | 
  8  |   test('Login page renders parent tab', async ({ page }) => {
  9  |     await page.goto(`${BASE}/parent/login`);
  10 |     await page.waitForLoadState('domcontentloaded');
  11 |     await page.waitForTimeout(3000);
  12 |     const body = await page.textContent('body');
  13 |     expect(body).toContain('Parent');
  14 |   });
  15 | 
  16 |   test('Dashboard redirects to login when no token', async ({ page }) => {
  17 |     await page.goto(`${BASE}/parent/login`);
  18 |     await page.waitForLoadState('domcontentloaded');
  19 |     await page.evaluate(() => {
  20 |       localStorage.removeItem('parentToken');
  21 |       localStorage.removeItem('parentProfile');
  22 |       localStorage.removeItem('studentToken');
  23 |       localStorage.removeItem('studentProfile');
  24 |     });
  25 |     await page.goto(`${BASE}/parent/dashboard`, { waitUntil: 'domcontentloaded' });
  26 |     // The portal guard clears tokens and routes to the unified login hub.
  27 |     // /parent/login is a legacy alias that server-redirects to /login, so the
  28 |     // canonical destination is /login (optionally with ?org=<slug>).
  29 |     await page.waitForURL(/\/login/, { timeout: 20000 });
  30 |     expect(page.url()).toContain('/login');
  31 |   });
  32 | 
  33 |   test('Dashboard loads without errors', async ({ page }) => {
  34 |     const errors: string[] = [];
  35 |     page.on('pageerror', (e) => errors.push(e.message));
  36 |     await page.goto(`${BASE}/parent/dashboard`);
  37 |     await page.waitForLoadState('domcontentloaded');
  38 |     await page.waitForTimeout(5000);
  39 |     expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  40 |   });
  41 | 
  42 |   test('Dashboard shows portal tabs', async ({ page }) => {
  43 |     await page.goto(`${BASE}/parent/dashboard`);
  44 |     await page.waitForLoadState('domcontentloaded');
  45 |     try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
  46 |     await page.waitForTimeout(5000);
  47 |     const body = await page.textContent('body');
  48 |     const hasTabs = body.includes('Overview') || body.includes('Attendance') || body.includes('Fees') || body.includes('No linked');
> 49 |     expect(hasTabs).toBeTruthy();
     |                     ^ Error: expect(received).toBeTruthy()
  50 |   });
  51 | 
  52 |   test('Responsive mobile renders without errors', async ({ page }) => {
  53 |     await page.setViewportSize({ width: 375, height: 812 });
  54 |     const errors: string[] = [];
  55 |     page.on('pageerror', (e) => errors.push(e.message));
  56 |     await page.goto(`${BASE}/parent/dashboard`);
  57 |     await page.waitForLoadState('domcontentloaded');
  58 |     await page.waitForTimeout(5000);
  59 |     expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  60 |   });
  61 | });
  62 | 
```