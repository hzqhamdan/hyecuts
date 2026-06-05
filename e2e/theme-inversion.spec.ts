import { test, expect } from '@playwright/test';

test.describe('Theme Color Inversion', () => {
  test('Book Now buttons should be white in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"]');
    const themeLabel = await themeToggle.innerText();
    console.log('Current Theme Label:', themeLabel);
    
    if (themeLabel.includes('Dark')) {
      await themeToggle.click();
    }
    
    // Wait for dark class
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 10000 });
    
    await page.waitForTimeout(1000);

    const bookNowButtons = page.locator('button:has-text("Book Now"), button:has-text("Tempah Sekarang")');
    const count = await bookNowButtons.count();
    console.log(`Found ${count} "Book Now" buttons`);

    for (let i = 0; i < count; i++) {
      const btn = bookNowButtons.nth(i);
      if (await btn.isVisible()) {
        // Trigger the debug log I added in the component
        await btn.click({ force: true }); 
        
        const bgColor = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        const textColor = await btn.evaluate((el) => window.getComputedStyle(el).color);
        console.log(`Button ${i} styles in Dark Mode: BG=${bgColor}, Text=${textColor}`);
        
        // Pure White: rgb(255, 255, 255)
        expect(bgColor).toBe('rgb(255, 255, 255)');
        expect(textColor).toBe('rgb(0, 0, 0)');
      }
    }
  });

  test('Book Now buttons should be black in light mode', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    const themeLabel = await themeToggle.innerText();
    
    if (themeLabel.includes('Light')) {
      await themeToggle.click();
    }
    
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.waitForTimeout(500);
    
    const bookNowButtons = page.locator('button:has-text("Book Now"), button:has-text("Tempah Sekarang")');
    const count = await bookNowButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = bookNowButtons.nth(i);
      if (await btn.isVisible()) {
        const bgColor = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        const textColor = await btn.evaluate((el) => window.getComputedStyle(el).color);
        console.log(`Button ${i} styles in Light Mode: BG=${bgColor}, Text=${textColor}`);
        
        expect(bgColor).toMatch(/rgb\(0, 0, 0\)|rgb\(26, 26, 26\)/);
        expect(textColor).toBe('rgb(255, 255, 255)');
      }
    }
  });
});
