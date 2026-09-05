import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api/v1';

let authToken: string;
let schoolId: string;

test.beforeAll(async ({ request }) => {
  const res = await request.post(`${API}/auth/login`, {
    data: {
      schoolCode: 'GULSHAN-01',
      email: 'admin@falconacademy.com',
      password: 'admin123',
    },
  });
  expect(res.ok()).toBeTruthy();
  authToken = (await res.json()).data.accessToken;
  expect(authToken).toBeTruthy();

  const schoolRes = await request.get(`${API}/schools`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const body = await schoolRes.json();
  const schools = Array.isArray(body.data) ? body.data : body.data.items ?? [];
  schoolId = schools[0]?.id;
});

const auth = () => ({ Authorization: `Bearer ${authToken}` });

test.describe('Org Admin API Flow', () => {
  test.describe('Authentication', () => {
    test('login with school code returns tokens + user', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: { schoolCode: 'GULSHAN-01', email: 'admin@falconacademy.com', password: 'admin123' },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeTruthy();
      expect(body.data.user.role).toBe('ADMIN');
      expect(body.data.user.schoolId).toBeTruthy();
    });

    test('login without school code also works for admin', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: { email: 'admin@falconacademy.com', password: 'admin123' },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data.user.role).toBe('ADMIN');
    });

    test('wrong password returns 401', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: { schoolCode: 'GULSHAN-01', email: 'admin@falconacademy.com', password: 'wrongpassword' },
      });
      expect(res.status()).toBe(401);
    });

    test('wrong school code returns 401', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: { schoolCode: 'WRONG-CODE', email: 'admin@falconacademy.com', password: 'admin123' },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('Auth /me', () => {
    test('auth/me returns admin profile with school', async ({ request }) => {
      const res = await request.get(`${API}/auth/me`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data.role).toBe('ADMIN');
      expect(body.data.schoolId).toBeTruthy();
    });

    test('auth/me without token returns 401', async ({ request }) => {
      const res = await request.get(`${API}/auth/me`);
      expect(res.status()).toBe(401);
    });
  });

  test.describe('School (Branch) Management', () => {
    test('GET /schools returns branch list', async ({ request }) => {
      const res = await request.get(`${API}/schools`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      const d = body.data;
      expect(Array.isArray(d) ? d.length : d.items?.length).toBeGreaterThan(0);
    });

    test('GET /schools/:id returns branch details', async ({ request }) => {
      const res = await request.get(`${API}/schools/${schoolId}`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data.id).toBe(schoolId);
      expect(body.data.name).toBeTruthy();
      expect(body.data.code).toBeTruthy();
    });

    test('GET /schools/:id/analytics returns stats', async ({ request }) => {
      const res = await request.get(`${API}/schools/${schoolId}/analytics`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data).toBeTruthy();
    });
  });

  test.describe('Students', () => {
    test('GET /students returns student list', async ({ request }) => {
      const res = await request.get(`${API}/students`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeTruthy();
    });

    test('GET /students with pagination', async ({ request }) => {
      const res = await request.get(`${API}/students?page=1&limit=5`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data).toBeTruthy();
    });

    test('GET /students/export returns data', async ({ request }) => {
      const res = await request.get(`${API}/students/export`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  test.describe('Academic', () => {
    test('GET /academic/schools/:id/classes returns classes', async ({ request }) => {
      const res = await request.get(`${API}/academic/schools/${schoolId}/classes`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test('GET /academic/schools/:id/academic-years returns years', async ({ request }) => {
      const res = await request.get(`${API}/academic/schools/${schoolId}/academic-years`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test('GET /academic/schools/:id/section-templates returns templates', async ({ request }) => {
      const res = await request.get(`${API}/academic/schools/${schoolId}/section-templates`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  test.describe('Fees', () => {
    test('GET /fees/structures returns fee structures', async ({ request }) => {
      const res = await request.get(`${API}/fees/structures`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test('GET /fees/schools/:id/structures returns branch fee structures', async ({ request }) => {
      const res = await request.get(`${API}/fees/schools/${schoolId}/structures`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test('GET /fees/records returns fee records', async ({ request }) => {
      const res = await request.get(`${API}/fees/records`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test('GET /fees/records/summary returns summary', async ({ request }) => {
      const res = await request.get(`${API}/fees/records/summary`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test('GET /fees/records/export returns export data', async ({ request }) => {
      const res = await request.get(`${API}/fees/records/export`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  test.describe('Attendance', () => {
    test('GET /attendance/daily returns daily report', async ({ request }) => {
      const res = await request.get(`${API}/attendance/daily`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test('GET /attendance/monthly returns monthly report', async ({ request }) => {
      const res = await request.get(`${API}/attendance/monthly`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test('GET /attendance/devices returns device list', async ({ request }) => {
      const res = await request.get(`${API}/attendance/devices`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });

    test('GET /attendance/off-days returns off days', async ({ request }) => {
      const res = await request.get(`${API}/attendance/off-days`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  test.describe('Staff Leave', () => {
    test('GET /staff-leave/ returns leave list', async ({ request }) => {
      const res = await request.get(`${API}/staff-leave/`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  test.describe('Notifications', () => {
    test('GET /notifications/portal returns notifications', async ({ request }) => {
      const res = await request.get(`${API}/notifications/portal`, { headers: auth() });
      expect(res.ok()).toBeTruthy();
    });
  });

  test.describe('RBAC', () => {
    test('admin cannot access /organizations/overview', async ({ request }) => {
      const res = await request.get(`${API}/organizations/overview`, { headers: auth() });
      expect(res.status()).toBe(403);
    });

    test('admin cannot access /students/platform', async ({ request }) => {
      const res = await request.get(`${API}/students/platform`, { headers: auth() });
      expect(res.status()).toBe(403);
    });

    test('admin cannot create school', async ({ request }) => {
      const res = await request.post(`${API}/schools`, {
        headers: auth(),
        data: { name: 'Test', code: 'TEST' },
      });
      expect(res.status()).toBe(403);
    });
  });
});
