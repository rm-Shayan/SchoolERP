import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'super-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/superadmin.json',
      },
      dependencies: ['setup'],
      testMatch: /superadmin.*\.spec\.ts/,
    },
    {
      name: 'org-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/orgadmin.json',
      },
      dependencies: ['setup'],
      testMatch: /orgadmin.*\.spec\.ts/,
    },
    {
      name: 'teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/teacher.json',
      },
      dependencies: ['setup'],
      testMatch: /teacher.*\.spec\.ts/,
    },
    {
      name: 'student',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/student.json',
      },
      dependencies: ['setup'],
      testMatch: /student.*\.spec\.ts/,
    },
    {
      name: 'parent',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/parent.json',
      },
      dependencies: ['setup'],
      testMatch: /parent.*\.spec\.ts/,
    },
  ],
});
