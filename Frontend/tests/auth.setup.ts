import { test as setup, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

setup('authenticate as super admin', async ({ page }) => {
  setup.setTimeout(60000);
  const res = await page.request.post(`${API}/auth/login`, {
    data: {
      email: 'superadmin@schoolerp.com',
      password: 'superadmin123',
    },
  });

  expect(res.ok(), `Login failed (${res.status()})`).toBeTruthy();
  const { accessToken, refreshToken, user } = (await res.json()).data;

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user }
  );

  await page.goto(`${BASE}/admin/dashboard`);
  await page.waitForTimeout(2000);
  await page.context().storageState({ path: 'tests/.auth/superadmin.json' });
});

setup('authenticate as org admin', async ({ page }) => {
  setup.setTimeout(60000);
  const res = await page.request.post(`${API}/auth/login`, {
    data: {
      schoolCode: 'GULSHAN-01',
      email: 'admin@falconacademy.com',
      password: 'admin123',
    },
  });

  expect(res.ok(), `Admin login failed (${res.status()})`).toBeTruthy();
  const { accessToken, refreshToken, user } = (await res.json()).data;

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user }
  );

  await page.goto(`${BASE}/branch/dashboard`);
  await page.waitForTimeout(2000);
  await page.context().storageState({ path: 'tests/.auth/orgadmin.json' });
});

setup('authenticate as teacher', async ({ page }) => {
  setup.setTimeout(60000);
  const res = await page.request.post(`${API}/auth/login`, {
    data: {
      schoolCode: 'GULSHAN-01',
      email: 'teacher@falconacademy.com',
      password: 'teacher123',
    },
  });

  expect(res.ok(), `Teacher login failed (${res.status()})`).toBeTruthy();
  const { accessToken, refreshToken, user } = (await res.json()).data;

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user }
  );

  await page.goto(`${BASE}/teacher/dashboard`);
  await page.waitForTimeout(2000);
  await page.context().storageState({ path: 'tests/.auth/teacher.json' });
});

setup('authenticate as student', async ({ page }) => {
  setup.setTimeout(60000);
  const res = await page.request.post(`${API}/auth/student/login`, {
    data: {
      schoolCode: 'GULSHAN-01',
      rollNumber: '101',
      password: 'GULSHAN-01',
    },
  });

  expect(res.ok(), `Student login failed (${res.status()})`).toBeTruthy();
  const { token, student } = (await res.json()).data;

  await page.goto(`${BASE}/parent/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ token, student }) => {
      localStorage.setItem('studentToken', token);
      localStorage.setItem('studentProfile', JSON.stringify(student));
    },
    { token, student }
  );

  await page.goto(`${BASE}/parent/dashboard`);
  await page.waitForTimeout(2000);
  await page.context().storageState({ path: 'tests/.auth/student.json' });
});

setup('authenticate as parent', async ({ page }) => {
  setup.setTimeout(60000);
  const res = await page.request.post(`${API}/auth/parent/login`, {
    data: {
      schoolCode: 'GULSHAN-01',
      phone: '0317-7777777',
      password: 'GULSHAN-01',
    },
  });

  expect(res.ok(), `Parent login failed (${res.status()})`).toBeTruthy();
  const { token, parent } = (await res.json()).data;

  await page.goto(`${BASE}/parent/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ token, parent }) => {
      localStorage.setItem('parentToken', token);
      localStorage.setItem('parentProfile', JSON.stringify(parent));
    },
    { token, parent }
  );

  await page.goto(`${BASE}/parent/dashboard`);
  await page.waitForTimeout(2000);
  await page.context().storageState({ path: 'tests/.auth/parent.json' });
});
