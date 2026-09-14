# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Frontend\tests\parent-api.spec.ts >> Parent Portal API Flow >> GET /auth/parent/me returns parent profile
- Location: Frontend\tests\parent-api.spec.ts:42:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link [ref=e5] [cursor=pointer]:
          - /url: /
          - img "SchoolERP" [ref=e7]
          - heading "SchoolERP" [level=3] [ref=e8]
        - navigation [ref=e9]:
          - link "Features" [ref=e10] [cursor=pointer]:
            - /url: "#features"
          - link "Modules" [ref=e11] [cursor=pointer]:
            - /url: "#modules"
          - link "Pricing" [ref=e12] [cursor=pointer]:
            - /url: "#pricing"
          - link "Why us" [ref=e13] [cursor=pointer]:
            - /url: "#why-us"
          - link "Get access" [ref=e14] [cursor=pointer]:
            - /url: "#access"
        - generic [ref=e15]:
          - link "Login" [ref=e16] [cursor=pointer]:
            - /url: /login
          - link "Get your school portal" [ref=e17] [cursor=pointer]:
            - /url: "#access"
    - main [ref=e18]:
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: Built for modern schools
          - heading "Run your school smarter with one digital campus." [level=1] [ref=e24]
          - paragraph [ref=e25]: Admissions, attendance, fees, teacher workflow, parent communication, and reporting — all in one secure SaaS experience.
          - generic [ref=e26]:
            - link "Get started" [ref=e27] [cursor=pointer]:
              - /url: /login
            - link "Explore features" [ref=e28] [cursor=pointer]:
              - /url: "#features"
          - generic [ref=e29]:
            - generic [ref=e30]: Multi-branch ready
            - generic [ref=e31]: Parent + staff portal
            - generic [ref=e32]: Secure cloud
        - generic [ref=e36]:
          - generic [ref=e38]:
            - generic [ref=e39]:
              - paragraph [ref=e40]: School overview
              - heading "Green Valley Academy" [level=2] [ref=e41]
            - generic [ref=e42]: Live
          - generic [ref=e43]:
            - generic [ref=e44]:
              - paragraph [ref=e45]: Enrollment
              - paragraph [ref=e46]: 1,248
              - paragraph [ref=e47]: +14% this term
            - generic [ref=e48]:
              - paragraph [ref=e49]: Fee collection
              - paragraph [ref=e50]: 92%
              - paragraph [ref=e51]: On-time rate
          - generic [ref=e52]:
            - generic [ref=e53]:
              - paragraph [ref=e54]: Today's activities
              - generic [ref=e55]: 2 mins ago
            - generic [ref=e56]:
              - generic [ref=e57]:
                - generic [ref=e58]:
                  - generic [ref=e59]: "01"
                  - generic [ref=e60]: Attendance sync
                - generic [ref=e61]: Done
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - generic [ref=e64]: "02"
                  - generic [ref=e65]: Fee reminder sent
                - generic [ref=e66]: Done
              - generic [ref=e67]:
                - generic [ref=e68]:
                  - generic [ref=e69]: "03"
                  - generic [ref=e70]: Teacher homework
                - generic [ref=e71]: Done
              - generic [ref=e72]:
                - generic [ref=e73]:
                  - generic [ref=e74]: "04"
                  - generic [ref=e75]: Parent dashboard update
                - generic [ref=e76]: Done
      - generic [ref=e79]:
        - generic [ref=e80]:
          - paragraph [ref=e84]: 60%
          - paragraph [ref=e85]: Faster admin workflows
        - generic [ref=e86]:
          - paragraph [ref=e90]: 2.5x
          - paragraph [ref=e91]: More parent engagement
        - generic [ref=e92]:
          - paragraph [ref=e96]: 24/7
          - paragraph [ref=e97]: School visibility online
        - generic [ref=e98]:
          - paragraph [ref=e102]: 99.9%
          - paragraph [ref=e103]: Operational reliability
      - generic [ref=e105]:
        - generic [ref=e107]:
          - paragraph [ref=e108]: Everything in one place
          - heading "Built for the way schools actually operate" [level=2] [ref=e109]
          - paragraph [ref=e110]: One platform covering every aspect of school management.
        - generic [ref=e111]:
          - generic [ref=e112]:
            - heading "Admissions & Enrollment" [level=3] [ref=e116]
            - paragraph [ref=e117]: Automate inquiries, online forms, student onboarding, and fee confirmation from a single portal.
          - generic [ref=e118]:
            - heading "Attendance Tracking" [level=3] [ref=e122]
            - paragraph [ref=e123]: Capture attendance with QR or manual checks and keep guardians informed in real time.
          - generic [ref=e124]:
            - heading "Fee Management" [level=3] [ref=e128]
            - paragraph [ref=e129]: Create fee structures, collect online payments, and track outstanding dues without spreadsheets.
          - generic [ref=e130]:
            - heading "Classroom & Homework" [level=3] [ref=e134]
            - paragraph [ref=e135]: Plan lessons, assign homework, and monitor classroom progress with smart academic workflows.
          - generic [ref=e136]:
            - heading "Parent Communication" [level=3] [ref=e140]
            - paragraph [ref=e141]: Keep parents informed through digital notices, progress updates, and event communication.
          - generic [ref=e142]:
            - heading "Reports & Insights" [level=3] [ref=e146]
            - paragraph [ref=e147]: Track performance across sections, staff, admissions, and finances using live dashboards.
      - generic [ref=e152]:
        - generic [ref=e153]:
          - paragraph [ref=e154]: Platform modules
          - heading "A complete school management experience from intake to graduation." [level=2] [ref=e155]
          - paragraph [ref=e156]: Whether you run a single campus or multiple branches, SchoolERP helps each team move faster with a shared source of truth.
        - generic [ref=e157]:
          - generic [ref=e158]:
            - paragraph [ref=e162]: School dashboard
            - paragraph [ref=e163]: Full visibility for principals
          - generic [ref=e164]:
            - paragraph [ref=e168]: Teacher tracking
            - paragraph [ref=e169]: Attendance and lesson plans
          - generic [ref=e170]:
            - paragraph [ref=e174]: Fee collection
            - paragraph [ref=e175]: Online payments and reminders
          - generic [ref=e176]:
            - paragraph [ref=e180]: Student & parent portals
            - paragraph [ref=e181]: Role-based access for all
          - generic [ref=e182]:
            - paragraph [ref=e186]: Transport & gate
            - paragraph [ref=e187]: Bus tracking and gate attendance
          - generic [ref=e188]:
            - paragraph [ref=e192]: Exams & analytics
            - paragraph [ref=e193]: Reports, results, and insights
      - generic [ref=e195]:
        - generic [ref=e197]:
          - paragraph [ref=e198]: Why schools choose us
          - heading "One platform, every stakeholder aligned" [level=2] [ref=e199]
        - generic [ref=e200]:
          - generic [ref=e201]:
            - heading "For School Admins" [level=3] [ref=e205]
            - paragraph [ref=e206]: Manage branches, staff, fees, and reporting from one secure command center.
          - generic [ref=e207]:
            - heading "For Teachers" [level=3] [ref=e211]
            - paragraph [ref=e212]: Track attendance, homework, conduct remarks, and schedule in minutes.
          - generic [ref=e213]:
            - heading "For Parents" [level=3] [ref=e217]
            - paragraph [ref=e218]: Stay informed about performance, fees, attendance, and school notices.
      - generic [ref=e220]:
        - generic [ref=e222]:
          - paragraph [ref=e223]: Simple, honest pricing
          - heading "Pick the plan that fits your school" [level=2] [ref=e224]
          - paragraph [ref=e225]: Every plan includes onboarding, training, and priority support. No hidden fees — cancel anytime.
        - generic [ref=e226]:
          - generic [ref=e227]:
            - generic [ref=e228]:
              - heading "Starter" [level=3] [ref=e229]
              - generic [ref=e230]: Up to 300 students
            - generic [ref=e231]:
              - generic [ref=e232]: $49
              - generic [ref=e233]: /month
            - paragraph [ref=e234]: For small schools going digital for the first time.
            - list [ref=e235]:
              - listitem [ref=e236]: Attendance & markbook
              - listitem [ref=e239]: Fee collection & receipts
              - listitem [ref=e242]: Parent portal
              - listitem [ref=e245]: Email + WhatsApp alerts
              - listitem [ref=e248]: Single campus
            - button "Continue" [ref=e251]
          - generic [ref=e252]:
            - generic [ref=e253]: Most popular
            - generic [ref=e254]:
              - heading "Growth" [level=3] [ref=e255]
              - generic [ref=e256]: Up to 1,500 students
            - generic [ref=e257]:
              - generic [ref=e258]: $99
              - generic [ref=e259]: /month
            - paragraph [ref=e260]: For growing schools that need multi-branch power.
            - list [ref=e261]:
              - listitem [ref=e262]: Everything in Starter
              - listitem [ref=e265]: Multi-branch management
              - listitem [ref=e268]: Student ID cards
              - listitem [ref=e271]: Exam results & grading
              - listitem [ref=e274]: Advanced reports
            - button "Continue" [ref=e277]
          - generic [ref=e278]:
            - generic [ref=e279]:
              - heading "Enterprise" [level=3] [ref=e280]
              - generic [ref=e281]: Unlimited
            - generic [ref=e282]: Custom
            - paragraph [ref=e284]: For campus networks and high-roll institutions.
            - list [ref=e285]:
              - listitem [ref=e286]: Everything in Growth
              - listitem [ref=e289]: Unlimited campuses
              - listitem [ref=e292]: Custom integrations
              - listitem [ref=e295]: Dedicated success manager
              - listitem [ref=e298]: On-premise option
            - button "Continue" [ref=e301]
        - paragraph [ref=e302]: Demo checkout only — no real payment is processed. SchoolERP is provisioned by our platform team.
      - generic [ref=e306]:
        - paragraph [ref=e307]: Portal access
        - heading "Your school portal, provisioned by your platform administrator." [level=2] [ref=e308]
        - paragraph [ref=e309]: SchoolERP is deployed to schools and campus networks by the platform team. Once your organization is onboarded, every role gets access instantly with no signup forms.
        - generic [ref=e310]:
          - link "School & staff sign in" [ref=e311] [cursor=pointer]:
            - /url: /login
          - link "Parent & student sign in" [ref=e312] [cursor=pointer]:
            - /url: /login
        - paragraph [ref=e313]: Already part of the platform? Your administrator has your portal ready.
        - link "Review plans & pricing" [ref=e314] [cursor=pointer]:
          - /url: "#pricing"
    - contentinfo [ref=e317]:
      - generic [ref=e318]:
        - generic [ref=e319]:
          - generic [ref=e320]:
            - generic [ref=e325]:
              - paragraph [ref=e326]: SchoolERP
              - paragraph [ref=e327]: School Management
            - paragraph [ref=e328]: Helps educational institutions automate daily operations, improve parent communication, and deliver a better digital experience for staff and students.
            - generic [ref=e329]:
              - link "LinkedIn" [ref=e330] [cursor=pointer]:
                - /url: "#"
              - link "X / Twitter" [ref=e333] [cursor=pointer]:
                - /url: "#"
              - link "Facebook" [ref=e336] [cursor=pointer]:
                - /url: "#"
          - generic [ref=e339]:
            - heading "Company" [level=3] [ref=e340]
            - list [ref=e341]:
              - listitem [ref=e342]:
                - link "Features" [ref=e343] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e344]:
                - link "Modules" [ref=e345] [cursor=pointer]:
                  - /url: "#modules"
              - listitem [ref=e346]:
                - link "Pricing" [ref=e347] [cursor=pointer]:
                  - /url: "#pricing"
              - listitem [ref=e348]:
                - link "Why us" [ref=e349] [cursor=pointer]:
                  - /url: "#why-us"
              - listitem [ref=e350]:
                - link "Get access" [ref=e351] [cursor=pointer]:
                  - /url: "#access"
          - generic [ref=e352]:
            - heading "Resources" [level=3] [ref=e353]
            - list [ref=e354]:
              - listitem [ref=e355]:
                - link "Login" [ref=e356] [cursor=pointer]:
                  - /url: /login
              - listitem [ref=e357]:
                - link "Admin access" [ref=e358] [cursor=pointer]:
                  - /url: /admin/login
              - listitem [ref=e359]:
                - link "Documentation" [ref=e360] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e361]:
                - link "Support" [ref=e362] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e363]:
            - heading "Contact" [level=3] [ref=e364]
            - list [ref=e365]:
              - listitem [ref=e366]: hello@schoolerp.com
              - listitem [ref=e369]: +1 (415) 849-2239
              - listitem [ref=e372]: 24/7 support for your campus
        - generic [ref=e375]:
          - paragraph [ref=e376]: © 2026 SchoolERP. All rights reserved.
          - generic [ref=e377]:
            - link "Privacy Policy" [ref=e378] [cursor=pointer]:
              - /url: "#"
            - link "Terms of Service" [ref=e379] [cursor=pointer]:
              - /url: "#"
  - button "Open Next.js Dev Tools" [ref=e385] [cursor=pointer]
  - alert [ref=e389]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const API = 'http://localhost:5000/api/v1';
  4  | 
  5  | test.describe('Parent Portal API Flow', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.goto('http://localhost:3000');
  8  |   });
  9  | 
  10 |   test('POST /auth/parent/login returns token + parent', async ({ page }) => {
  11 |     const res = await page.request.post(`${API}/auth/parent/login`, {
  12 |       data: { schoolCode: 'DEMO-01', phone: '03234000047', password: 'DEMO-01' },
  13 |     });
  14 |     expect(res.ok()).toBeTruthy();
  15 |     const json = await res.json();
  16 |     expect(json.data.token).toBeTruthy();
  17 |     expect(json.data.parent).toBeDefined();
  18 |     expect(json.data.parent.name).toBeTruthy();
  19 |   });
  20 | 
  21 |   test('POST /auth/parent/login with wrong password returns 401', async ({ page }) => {
  22 |     const res = await page.request.post(`${API}/auth/parent/login`, {
  23 |       data: { schoolCode: 'DEMO-01', phone: '03234000047', password: 'wrong' },
  24 |     });
  25 |     expect(res.status()).toBe(401);
  26 |   });
  27 | 
  28 |   test('POST /auth/parent/login with wrong phone returns 401', async ({ page }) => {
  29 |     const res = await page.request.post(`${API}/auth/parent/login`, {
  30 |       data: { schoolCode: 'DEMO-01', phone: '0399-9999999', password: 'DEMO-01' },
  31 |     });
  32 |     expect(res.status()).toBe(401);
  33 |   });
  34 | 
  35 |   test('POST /auth/parent/login with wrong school code returns 401', async ({ page }) => {
  36 |     const res = await page.request.post(`${API}/auth/parent/login`, {
  37 |       data: { schoolCode: 'WRONG-CODE', phone: '03234000047', password: 'DEMO-01' },
  38 |     });
  39 |     expect(res.status()).toBe(401);
  40 |   });
  41 | 
  42 |   test('GET /auth/parent/me returns parent profile', async ({ page }) => {
  43 |     const token = await page.evaluate(() => localStorage.getItem('parentToken'));
  44 |     const res = await page.request.get(`${API}/auth/parent/me`, {
  45 |       headers: { Authorization: `Bearer ${token}` },
  46 |     });
> 47 |     expect(res.ok()).toBeTruthy();
     |                      ^ Error: expect(received).toBeTruthy()
  48 |     const json = await res.json();
  49 |     expect(json.data.name).toBeTruthy();
  50 |     expect(json.data.children).toBeDefined();
  51 |   });
  52 | 
  53 |   test('GET /auth/parent/me without token returns 401', async ({ page }) => {
  54 |     const res = await page.request.get(`${API}/auth/parent/me`);
  55 |     expect(res.status()).toBe(401);
  56 |   });
  57 | 
  58 |   test('Parent cannot access staff-only /auth/me', async ({ page }) => {
  59 |     const token = await page.evaluate(() => localStorage.getItem('parentToken'));
  60 |     const res = await page.request.get(`${API}/auth/me`, {
  61 |       headers: { Authorization: `Bearer ${token}` },
  62 |     });
  63 |     expect([401, 403]).toContain(res.status());
  64 |   });
  65 | 
  66 |   test('Parent cannot access /organizations/overview', async ({ page }) => {
  67 |     const token = await page.evaluate(() => localStorage.getItem('parentToken'));
  68 |     const res = await page.request.get(`${API}/organizations/overview`, {
  69 |       headers: { Authorization: `Bearer ${token}` },
  70 |     });
  71 |     expect([401, 403]).toContain(res.status());
  72 |   });
  73 | 
  74 |   test('Parent cannot access /audit-logs', async ({ page }) => {
  75 |     const token = await page.evaluate(() => localStorage.getItem('parentToken'));
  76 |     const res = await page.request.get(`${API}/audit-logs`, {
  77 |       headers: { Authorization: `Bearer ${token}` },
  78 |     });
  79 |     expect([401, 403]).toContain(res.status());
  80 |   });
  81 | });
  82 | 
```