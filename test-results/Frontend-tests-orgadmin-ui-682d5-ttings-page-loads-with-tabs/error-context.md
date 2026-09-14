# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Frontend\tests\orgadmin-ui.spec.ts >> Org Admin UI Flow >> Settings Page >> settings page loads with tabs
- Location: Frontend\tests\orgadmin-ui.spec.ts:184:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Settings' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Settings' })

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
  161 |       await page.goto(`${BASE}/branch/attendance/gate`);
  162 |       await waitForHydration(page);
  163 |       const body = await page.textContent('body');
  164 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  165 |     });
  166 |   });
  167 | 
  168 |   test.describe('Admissions Page', () => {
  169 |     test('admissions page loads', async ({ page }) => {
  170 |       await page.goto(`${BASE}/branch/admissions`);
  171 |       await waitForHydration(page);
  172 |       await expect(page.getByRole('heading', { name: 'Admissions' })).toBeVisible();
  173 |     });
  174 | 
  175 |     test('admissions page has new inquiry button', async ({ page }) => {
  176 |       await page.goto(`${BASE}/branch/admissions`);
  177 |       await waitForHydration(page);
  178 |       const body = await page.textContent('body');
  179 |       expect(body).toContain('New Inquiry');
  180 |     });
  181 |   });
  182 | 
  183 |   test.describe('Settings Page', () => {
  184 |     test('settings page loads with tabs', async ({ page }) => {
  185 |       await page.goto(`${BASE}/branch/settings`);
  186 |       await waitForHydration(page);
> 187 |       await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  188 |       const body = await page.textContent('body');
  189 |       expect(body).toContain('My Profile');
  190 |       expect(body).toContain('Change Password');
  191 |     });
  192 | 
  193 |     test('settings page has branch profile tab', async ({ page }) => {
  194 |       await page.goto(`${BASE}/branch/settings`);
  195 |       await waitForHydration(page);
  196 |       const body = await page.textContent('body');
  197 |       expect(body).toContain('Branch Profile');
  198 |     });
  199 |   });
  200 | 
  201 |   test.describe('Other Pages Load Without Errors', () => {
  202 |     const pages = [
  203 |       { path: '/branch/homework', name: 'Homework' },
  204 |       { path: '/branch/timetable', name: 'Timetable' },
  205 |       { path: '/branch/exams', name: 'Exams' },
  206 |       { path: '/branch/exams/results', name: 'Exam Results' },
  207 |       { path: '/branch/promotions', name: 'Promotions' },
  208 |       { path: '/branch/leave', name: 'Leave' },
  209 |       { path: '/branch/conduct', name: 'Conduct' },
  210 |       { path: '/branch/ptm', name: 'PTM' },
  211 |       { path: '/branch/study-material', name: 'Study Material' },
  212 |       { path: '/branch/announcements/circulars', name: 'Announcements' },
  213 |       { path: '/branch/notifications', name: 'Notifications' },
  214 |     ];
  215 | 
  216 |     for (const p of pages) {
  217 |       test(`${p.name} page loads without errors`, async ({ page }) => {
  218 |         const errors: string[] = [];
  219 |         page.on('pageerror', (e) => errors.push(e.message));
  220 |         await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded' });
  221 |         await waitForHydration(page);
  222 |         expect(errors).toEqual([]);
  223 |       });
  224 |     }
  225 |   });
  226 | 
  227 |   test.describe('Navigation Flow', () => {
  228 |     test('sidebar links all work without errors', async ({ page }) => {
  229 |       test.setTimeout(90000);
  230 |       const errors: string[] = [];
  231 |       page.on('pageerror', (e) => errors.push(e.message));
  232 | 
  233 |       const pages = [
  234 |         '/branch/dashboard',
  235 |         '/branch/students',
  236 |         '/branch/staff',
  237 |         '/branch/academic',
  238 |         '/branch/fees/structures',
  239 |         '/branch/attendance/records',
  240 |         '/branch/settings',
  241 |       ];
  242 | 
  243 |       for (const path of pages) {
  244 |         await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  245 |         await page.waitForTimeout(3000);
  246 |         const body = await page.textContent('body');
  247 |         expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  248 |       }
  249 |       expect(errors).toEqual([]);
  250 |     });
  251 |   });
  252 | 
  253 |   test.describe('Responsive', () => {
  254 |     test('mobile viewport renders without errors', async ({ page }) => {
  255 |       await page.setViewportSize({ width: 375, height: 812 });
  256 |       const errors: string[] = [];
  257 |       page.on('pageerror', (e) => errors.push(e.message));
  258 | 
  259 |       await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
  260 |       await waitForHydration(page);
  261 |       expect(errors).toEqual([]);
  262 |     });
  263 | 
  264 |     test('tablet viewport renders without errors', async ({ page }) => {
  265 |       await page.setViewportSize({ width: 768, height: 1024 });
  266 |       const errors: string[] = [];
  267 |       page.on('pageerror', (e) => errors.push(e.message));
  268 | 
  269 |       await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
  270 |       await waitForHydration(page);
  271 |       expect(errors).toEqual([]);
  272 |     });
  273 |   });
  274 | });
  275 | 
```