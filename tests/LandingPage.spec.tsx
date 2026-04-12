import { test, expect } from '@playwright/test';

test.describe('Landing Page is Properly Rendered', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321/');
  });
  
  test('Title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/ICUのじかんわり/);
  });
});
