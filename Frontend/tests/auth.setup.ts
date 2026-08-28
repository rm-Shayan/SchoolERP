import { test as setup, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

setup('authenticate as org admin', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  const res = await page.request.post(`${API}/auth/login`, {
    data: {
      schoolCode: 'OX-F34-01',
      email: 'areesharao9@gmail.com',
      password: 'areesharao',
    },
  });
  expect(res.ok(), 'login API must succeed').toBeTruthy();
  const json = await res.json();
  const { accessToken, refreshToken, user } = json.data;
  const organization = user.organization ?? json.data.organization ?? null;
  const school = user.school ?? json.data.school ?? null;
  await page.evaluate(
    ({ accessToken, refreshToken, user, organization, school }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      if (organization) localStorage.setItem('organization', JSON.stringify(organization));
      if (school) localStorage.setItem('school', JSON.stringify(school));
    },
    { accessToken, refreshToken, user, organization, school }
  );
  await page.goto(`${BASE}/o/oxford/branch/dashboard`);
  await expect(page).toHaveURL(/o\/oxford\/branch\/dashboard/);
  await page.context().storageState({ path: 'tests/.auth/user.json' });
});
