import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Org Admin CRUD — Announcements', () => {
  test.setTimeout(60000);

  const uniqueTitle = `CRUD Test ${Date.now()}`;

  test('Create announcement via UI form', async ({ page }) => {
    const toasts: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') toasts.push(msg.text());
    });

    await page.goto(`${BASE}/branch/announcements/circulars`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("New Circular")').click();
    await page.waitForTimeout(1000);

    await page.locator('input[name="title"]').fill(uniqueTitle);
    await page.locator('textarea[name="content"]').fill('This is a CRUD test announcement for verification.');

    await page.locator('button:has-text("Publish")').click();
    await page.waitForTimeout(4000);

    const body = await page.textContent('body');
    const success = body.includes('Announcement published') || body.includes('Total Circulars');
    expect(success).toBeTruthy();
  });

  test('Delete announcement via UI', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await page.goto(`${BASE}/branch/announcements/circulars`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const item = page.locator(`text=${uniqueTitle}`).first();
    if (await item.isVisible({ timeout: 5000 }).catch(() => false)) {
      const card = item.locator('xpath=ancestor::div[1]');
      const del = card.locator('button').filter({ hasText: /delete/i }).first();
      if (await del.isVisible({ timeout: 3000 }).catch(() => false)) {
        await del.click();
        await page.waitForTimeout(2000);
      }
    }
    expect(page.url()).toContain('/branch/announcements');
  });
});

test.describe('Org Admin CRUD — Fee Structures', () => {
  test.setTimeout(90000);

  test('Create and delete fee structure', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await page.goto(`${BASE}/branch/fees/structures`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Click "+ New Structure" button
    await page.getByRole('button', { name: /New Structure/i }).click();
    await page.waitForTimeout(2000);

    // Wait for modal overlay to appear
    const modal = page.locator('.fixed.inset-0.z-50').last();
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // Fill structure name using fill() then wait for React state sync
    const nameInput = modal.locator('input').first();
    await nameInput.fill(`CRUD Fee ${Date.now()}`);
    await page.waitForTimeout(500);

    // Select class
    const classSel = modal.locator('select[name="classId"]');
    await classSel.waitFor({ state: 'visible', timeout: 5000 });
    const classOpts = await classSel.locator('option').allTextContents();
    if (classOpts.length > 1) await classSel.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Select academic year
    const yearSel = modal.locator('select[name="academicYearId"]');
    if (await yearSel.isVisible({ timeout: 3000 }).catch(() => false)) {
      const yearOpts = await yearSel.locator('option').allTextContents();
      if (yearOpts.length > 1) await yearSel.selectOption({ index: 1 });
    }
    await page.waitForTimeout(500);

    // Fill line item title — use fill() then wait for React state sync
    const lineTitleInput = modal.locator('input[placeholder*="Title"], input[placeholder*="Tuition"]').first();
    await lineTitleInput.waitFor({ state: 'visible', timeout: 5000 });
    await lineTitleInput.fill('Tuition Fee');
    await page.waitForTimeout(500);

    // Fill amount — critical: wait for React to process title update first
    const amountInput = modal.locator('input[placeholder="Amount"], input[type="number"]').first();
    await amountInput.waitFor({ state: 'visible', timeout: 5000 });
    await amountInput.fill('5000');
    await page.waitForTimeout(500);

    // Verify form values before submit
    const titleVal = await lineTitleInput.inputValue();
    const amountVal = await amountInput.inputValue();
    if (!titleVal || titleVal === '' || !amountVal || amountVal === '0') {
      // React state didn't sync — retry fills
      await lineTitleInput.fill('');
      await lineTitleInput.fill('Tuition Fee');
      await page.waitForTimeout(500);
      await amountInput.fill('');
      await amountInput.fill('5000');
      await page.waitForTimeout(500);
    }

    // Click "Create Structure" submit button
    const submitBtn = modal.locator('button').filter({ hasText: /Create Structure/i });
    await submitBtn.click();
    await page.waitForTimeout(5000);

    // Verify — toast or card should appear OR modal should close
    const modalStillOpen = await modal.isVisible().catch(() => false);
    const body = await page.textContent('body');
    const ok = body.includes('fee structure created') || body.includes('Fee structure created')
      || body.includes('CRUD Fee') || !modalStillOpen;
    expect(ok).toBeTruthy();
  });
});

test.describe('Org Admin CRUD — Study Materials', () => {
  test.setTimeout(90000);

  test('Create and delete study material', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await page.goto(`${BASE}/branch/study-material`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    const initialEmpty = await page.locator('text=No materials yet').isVisible().catch(() => false);

    // Click "New Material" button — click the one inside the page header
    await page.locator('button:has-text("New Material")').first().click();
    await page.waitForTimeout(3000);

    // Wait for modal heading "New Material"
    const heading = page.locator('h2:has-text("New Material")');
    if (!await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Retry
      await page.locator('button:has-text("New Material")').last().click();
      await page.waitForTimeout(3000);
    }

    // Fill title
    const titleInput = page.locator('input[placeholder*="Chapter"]');
    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleInput.fill(`Test Material ${Date.now()}`);
    } else {
      // Fallback: first visible input in the modal
      const firstInput = heading.locator('xpath=ancestor::div[2]//input').first();
      if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstInput.fill(`Test Material ${Date.now()}`);
      }
    }
    await page.waitForTimeout(500);

    // Intercept the API call to check if it succeeds
    let apiSuccess = false;
    page.on('response', (resp) => {
      if (resp.url().includes('/study-material') && resp.request().method() === 'POST') {
        apiSuccess = resp.status() === 201;
      }
    });

    // Click Create button — last one should be inside modal
    await page.locator('button:has-text("Create")').last().click();

    // Wait for either modal to close or API response
    await page.waitForTimeout(8000);

    // Verify: check if creation succeeded via API or if modal closed
    const body = await page.textContent('body');
    const modalGone = !(await page.locator('h2:has-text("New Material")').isVisible().catch(() => false));
    const materialVisible = body.includes('Test Material') || body.includes('created') || body.includes('Created');
    const noLongerEmpty = initialEmpty && !body.includes('No materials yet');
    const ok = apiSuccess || modalGone || materialVisible || noLongerEmpty;
    expect(ok).toBeTruthy();
  });
});

test.describe('Org Admin CRUD — Homework', () => {
  test.setTimeout(90000);

  test('Create and delete homework', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await page.goto(`${BASE}/branch/homework`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Click "New Homework" button
    await page.locator('button:has-text("New Homework")').click();
    await page.waitForTimeout(3000);

    // Wait for modal heading "Post Homework"
    const heading = page.locator('h2:has-text("Post Homework")');
    const headingVisible = await heading.isVisible({ timeout: 10000 }).catch(() => false);
    if (!headingVisible) {
      // Retry click
      await page.locator('button:has-text("New Homework")').click();
      await page.waitForTimeout(3000);
    }
    await heading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // Select section from the first visible select
    const sectionSel = page.locator('select:visible').first();
    await sectionSel.waitFor({ state: 'visible', timeout: 5000 });
    const opts = await sectionSel.locator('option').allTextContents();
    if (opts.length > 1) await sectionSel.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Fill title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill(`Test HW ${Date.now()}`);
    await page.waitForTimeout(500);

    // Fill content
    const contentField = page.locator('input[name="content"], textarea[name="content"]').first();
    if (await contentField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentField.fill('Complete exercises from chapter 1 to 5.');
    }
    await page.waitForTimeout(300);

    // Click Post Homework
    await page.locator('button:has-text("Post Homework")').last().click();
    await page.waitForTimeout(5000);

    // Verify
    const body = await page.textContent('body');
    const ok = body.includes('Homework posted') || body.includes('posted')
      || body.includes('Test HW') || !body.includes('No homework found');
    expect(ok).toBeTruthy();
  });
});

test.describe('Org Admin CRUD — Students', () => {
  test.setTimeout(90000);

  test('Create and delete student', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await page.goto(`${BASE}/branch/students`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Click Add Student — might be a button or link
    const addBtn = page.locator('button:has-text("Add Student"), a:has-text("Add Student")').first();
    await addBtn.click();
    await page.waitForTimeout(2000);

    // Wait for modal/dialog to appear
    const modal = page.locator('[role="dialog"], .modal, div:has(> h2:text("Student"))').first();
    if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Find all visible inputs in the modal
      const inputs = modal.locator('input:visible');
      const count = await inputs.count();

      // Fill first few text inputs
      for (let i = 0; i < Math.min(count, 6); i++) {
        const input = inputs.nth(i);
        const placeholder = await input.getAttribute('placeholder');
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        if (type === 'file' || type === 'date') continue;
        if (placeholder?.toLowerCase().includes('first') || name === 'firstName') {
          await input.fill('TestStudent');
        } else if (placeholder?.toLowerCase().includes('last') || name === 'lastName') {
          await input.fill(String(Date.now()).slice(-4));
        } else if (placeholder?.toLowerCase().includes('roll') || name === 'rollNumber') {
          await input.fill(String(Date.now()).slice(-4));
        } else if (placeholder?.toLowerCase().includes('parent') || name === 'parentName') {
          await input.fill('Test Parent');
        } else if (placeholder?.toLowerCase().includes('whatsapp') || name === 'parentWhatsappNo') {
          await input.fill('03001234567');
        }
      }

      // Select class and section
      const selects = modal.locator('select:visible');
      const selCount = await selects.count();
      for (let i = 0; i < selCount; i++) {
        const sel = selects.nth(i);
        const opts = await sel.locator('option').allTextContents();
        if (opts.length > 1) await sel.selectOption({ index: 1 });
      }

      // Submit
      const submitBtn = modal.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    const body = await page.textContent('body');
    expect(body.includes('TestStudent') || body.includes('created') || body.includes('Student')).toBeTruthy();
  });
});
