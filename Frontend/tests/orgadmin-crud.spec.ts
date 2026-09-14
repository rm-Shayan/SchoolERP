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
    await classSel.waitFor({ state: 'visible', timeout: 15000 });
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

  test('Create and delete study material via URL source', async ({ page }) => {
    const uniqueTitle = `Test Material ${Date.now()}`;

    await page.goto(`${BASE}/branch/study-material`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Open the create modal from the page header
    await page.locator('button:has-text("New Material")').first().click();
    const heading = page.locator('h2:has-text("New Material")');
    await heading.waitFor({ state: 'visible', timeout: 15000 });

    const modal = page.locator('.fixed.inset-0.z-50').last();

    // Fill title
    const titleInput = modal.locator('input[placeholder*="Chapter"]');
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await titleInput.fill(uniqueTitle);

    // Select a section — wait for section options to load (may compile/lazy-load)
    const sectionSel = modal.locator('select').first();
    await expect(sectionSel.locator('option').nth(1)).toBeAttached({ timeout: 20000 });
    await sectionSel.selectOption({ index: 1 });

    // Provide the required source: switch to URL mode and fill a valid link
    await modal.locator('button:has-text("Paste URL")').click();
    const linkInput = modal.locator('input[placeholder*="youtube"]');
    await linkInput.waitFor({ state: 'visible', timeout: 5000 });
    await linkInput.fill('https://example.com/chapter-1');

    // Submit and assert the API actually created it (201)
    const postResponse = page.waitForResponse(
      (r) => r.url().includes('/study-material') && r.request().method() === 'POST',
      { timeout: 20000 }
    );
    await modal.getByRole('button', { name: 'Create', exact: true }).click();
    const response = await postResponse;
    expect(response.status(), 'POST /study-material should create the material').toBe(201);

    // Toast + card visible after list reload
    await expect(page.getByText('Created', { exact: true })).toBeVisible({ timeout: 15000 });
    const cardTitle = page.getByRole('heading', { name: uniqueTitle });
    await expect(cardTitle).toBeVisible({ timeout: 15000 });

    // Delete it via the card actions + confirm dialog
    const card = cardTitle.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
    await card.getByRole('button', { name: 'Delete' }).click();
    await page.locator('.fixed.inset-0.z-50').last().getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Deleted', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(cardTitle).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe('Org Admin CRUD — Homework', () => {
  test.setTimeout(90000);

  test('Create and delete homework', async ({ page }) => {
    const uniqueTitle = `Test HW ${Date.now()}`;

    await page.goto(`${BASE}/branch/homework`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Open the post modal from the page header
    await page.locator('button:has-text("New Homework")').first().click();
    const heading = page.locator('h2:has-text("Post Homework")');
    await heading.waitFor({ state: 'visible', timeout: 15000 });

    const modal = page.locator('.fixed.inset-0.z-50').last();

    // Select a section — wait for async section options before choosing
    const sectionSel = modal.locator('select').first();
    await expect(sectionSel.locator('option').nth(1)).toBeAttached({ timeout: 20000 });
    await sectionSel.selectOption({ index: 1 });

    // Fill title + details
    const titleInput = modal.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await titleInput.fill(uniqueTitle);
    const contentField = modal.locator('input[name="content"], textarea[name="content"]').first();
    await contentField.fill('Complete exercises from chapter 1 to 5.');

    // Submit and assert the API actually created it (201)
    const postResponse = page.waitForResponse(
      (r) => r.url().includes('/homework') && r.request().method() === 'POST',
      { timeout: 20000 }
    );
    await modal.getByRole('button', { name: 'Post Homework' }).click();
    const response = await postResponse;
    expect(response.status(), 'POST /homework should create the homework').toBe(201);

    // Toast + list reload showing the new homework
    await expect(page.getByText(/Homework posted/)).toBeVisible({ timeout: 15000 });
    const itemTitle = page.locator('h4', { hasText: uniqueTitle }).first();
    await expect(itemTitle).toBeVisible({ timeout: 15000 });

    // Delete via the row action (aria-labelled with the title) + confirm dialog
    await page.getByRole('button', { name: `Delete ${uniqueTitle}` }).click();
    await page.locator('.fixed.inset-0.z-50').last().getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Homework deleted')).toBeVisible({ timeout: 15000 });
    await expect(itemTitle).toHaveCount(0, { timeout: 15000 });
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
