import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Hyecuts|The Studio/i);
});

test('can navigate to lounge', async ({ page }) => {
  await page.goto('/');

  // On desktop
  const loungeButton = page.getByRole('button', { name: /lounge/i }).first();
  await expect(loungeButton).toBeVisible();
  await loungeButton.click();

  // Give it a moment to transition
  await page.waitForTimeout(1000);
  
  // The login screen shows an input for "Enter your identifier"
  await expect(page.getByPlaceholder(/Enter your identifier/i).first()).toBeVisible();
});
