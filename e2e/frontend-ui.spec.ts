import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { MEMBER, signInAs } from './support/mockApi';

const inMalay = (page: Page) => page.getByText(/^Guntingan rambut tepat/);
const inEnglish = (page: Page) => page.getByText(/^Precision cuts, curated service/);
const languageButton = (page: Page) => page.getByRole('navigation').getByRole('button', { name: /^(EN|Malaysia MY)$/ });

test.describe('Landing page', () => {
  test('loads with the studio title and its calls to action', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', e => errors.push(e));
    await page.goto('/');

    await expect(page).toHaveTitle(/Hyecuts|The Studio/i);
    await expect(page.getByRole('button', { name: 'Secure Appointment' })).toBeVisible();
    await page.getByRole('button', { name: 'Book Appointment' }).first().click();
    await expect(page).toHaveURL('/booking');
    expect(errors).toEqual([]);
  });

  test('the lounge button sends a visitor to sign in', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Member Lounge' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByPlaceholder('Enter your identifier')).toBeVisible();
  });
});

test.describe('Language', () => {
  test.describe('in a browser set to plain English', () => {
    test.use({ locale: 'en' });

    test('switches the page to Malay and back, and remembers the choice', async ({ page }) => {
      await page.goto('/');
      await expect(languageButton(page)).toHaveText('EN');

      await languageButton(page).click();
      await expect(inMalay(page)).toBeVisible();
      await expect(page.locator('html')).not.toHaveClass(/dark/);

      await page.reload();
      await expect(inMalay(page)).toBeVisible();

      await languageButton(page).click();
      await expect(inEnglish(page)).toBeVisible();
    });

    test('the choice carries over to the booking flow and the sign-in screen', async ({ page }) => {
      await page.goto('/');
      await languageButton(page).click();

      await page.goto('/booking');
      await expect(page.getByRole('button', { name: /Teruskan sebagai Tetamu/ })).toBeVisible();
      await page.goto('/login');
      await expect(page.getByRole('button', { name: 'Sahkan' })).toBeVisible();
    });
  });

  // E2E-002: the toggles compare i18n.language with 'en', but the detector
  // stores the browser's full tag. In an en-US or en-GB browser the page is in
  // English yet the button shows the Malaysian flag, and the first click
  // "switches" to English, so it takes two clicks to reach Malay.
  test('one click switches an en-US browser to Malay', async ({ page }) => {
    test.fail();
    await page.goto('/');
    await expect(languageButton(page)).toHaveText('EN');
    await languageButton(page).click();

    await expect(inMalay(page)).toBeVisible();
  });
});

test.describe('Theme', () => {
  test('dark mode applies at once and survives a reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem('hyecuts-theme-v2'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('the Book Now buttons invert between light and dark', async ({ page }) => {
    await page.goto('/');
    const bookNow = page.getByRole('button', { name: 'Book Now' }).filter({ visible: true }).first();
    await bookNow.scrollIntoViewIfNeeded();
    const colours = () => bookNow.evaluate(el => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, text: style.color };
    });

    await expect.poll(colours).toEqual({ background: expect.stringMatching(/^rgb\((0, 0, 0|26, 26, 26)\)$/), text: 'rgb(255, 255, 255)' });
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect.poll(colours).toEqual({ background: 'rgb(255, 255, 255)', text: 'rgb(0, 0, 0)' });
  });
});

test.describe('Phone-width layout (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const noSideScroll = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  for (const path of ['/', '/booking', '/login']) {
    test(`${path} fits the screen without sideways scrolling`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await noSideScroll(page)).toBe(true);
    });
  }

  test('the landing menu opens and leads to booking', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Book Appointment' })).toBeHidden();
    await page.getByRole('navigation').getByRole('button').last().click();
    await page.getByRole('button', { name: 'Book Appointment' }).filter({ visible: true }).click();

    await expect(page).toHaveURL('/booking');
  });

  test('a member can use the lounge, and its menu, at phone width', async ({ page }) => {
    await signInAs(page, MEMBER);
    await page.goto('/lounge');

    await expect(page.getByRole('heading', { name: 'Insider' })).toBeVisible();
    expect(await noSideScroll(page)).toBe(true);
    await page.getByRole('navigation').getByRole('button').filter({ hasNotText: /\S/ }).filter({ visible: true }).first().click();
    await page.getByRole('button', { name: 'My Appointments' }).filter({ visible: true }).click();
    await expect(page).toHaveURL('/my-bookings');
  });
});
