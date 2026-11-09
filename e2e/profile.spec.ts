import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { MEMBER, signInAs } from './support/mockApi';

// A 1x1 transparent PNG.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function openProfile(page: Page) {
  await page.goto('/lounge');
  await page.getByRole('button', { name: 'Profile & Privacy' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'General Info' })).toBeVisible();
}

// The labels are not tied to their inputs (no htmlFor), so find each input as
// the element that follows its label.
const field = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).filter({ visible: true })
    .locator('xpath=following-sibling::*[1]/descendant-or-self::input');

test.beforeEach(async ({ page }) => {
  await signInAs(page, MEMBER);
});

test.describe('Profile details', () => {
  test('are pre-filled from the server and saved back', async ({ page, api }) => {
    await openProfile(page);
    await expect(field(page, 'Full Name')).toHaveValue('Aiman Rahman');
    await expect(field(page, 'Email Address')).toHaveValue(MEMBER.username);
    await expect(field(page, 'Phone Number')).toHaveValue('12-345 6789');

    await field(page, 'Full Name').fill('Aiman bin Rahman');
    await field(page, 'Email Address').fill('  aiman@example.com ');
    await field(page, 'Phone Number').fill('198765432');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByRole('button', { name: 'Profile updated successfully.' })).toBeVisible();
    const [save] = api.sent('PUT', `/loyalty/profile/${MEMBER.id}`);
    expect(save.token).toBe(MEMBER.token);
    expect(save.body).toMatchObject({
      fullName: 'Aiman bin Rahman',
      email: 'aiman@example.com',
      phone: '+60 19-876 5432',
      dob: '1995-04-12',
      avatar: null,
    });
    // The lounge reloads the profile so the rest of the page sees the change.
    await expect.poll(() => api.sent('GET', `/loyalty/profile/${MEMBER.id}`).length).toBeGreaterThan(1);
    await expect(page.getByRole('heading', { name: 'Aiman bin Rahman' }).filter({ visible: true })).toBeVisible();
  });

  test('the phone number is formatted as it is typed and capped at nine digits', async ({ page }) => {
    await openProfile(page);
    const phone = field(page, 'Phone Number');
    await phone.fill('');
    await phone.pressSequentially('1a2-3456789012');

    await expect(phone).toHaveValue('12-345 6789');
  });

  // E2E-007: the field keeps the leading 0 of a local number after its +60
  // prefix and then caps at nine digits, so 019-876 5432 is saved as
  // +60 01-987 6543: a wrong number with the last digit dropped.
  test('a number typed with its leading 0 is saved in +60 form', async ({ page, api }) => {
    test.fail();
    await openProfile(page);
    await field(page, 'Phone Number').fill('0198765432');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect.poll(() => api.sent('PUT', `/loyalty/profile/${MEMBER.id}`).length).toBe(1);
    expect((api.sent('PUT', `/loyalty/profile/${MEMBER.id}`)[0].body as { phone: string }).phone).toBe('+60 19-876 5432');
  });

  test('a rejected save shows the server\'s reason and is not reported as saved', async ({ page }) => {
    await openProfile(page);
    await field(page, 'Email Address').fill('not-an-email');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  });

  test('hair profile choices are saved with the profile', async ({ page, api }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Hair Profile' }).filter({ visible: true }).click();
    await page.getByText('Curly', { exact: true }).click();
    await page.getByText('Long', { exact: true }).click();
    await page.getByText('Sensitive', { exact: true }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect.poll(() => api.sent('PUT', `/loyalty/profile/${MEMBER.id}`).length).toBe(1);
    expect((api.sent('PUT', `/loyalty/profile/${MEMBER.id}`)[0].body as { hairProfile: unknown }).hairProfile)
      .toEqual({ type: 'curly', length: 'long', scalp: 'sensitive' });
  });
});

test.describe('Avatar', () => {
  test('an image is previewed and saved with the profile', async ({ page, api }) => {
    await openProfile(page);
    await page.locator('#avatar-upload').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: TINY_PNG });

    await expect(page.getByAltText('Avatar').filter({ visible: true })).toHaveAttribute('src', /^data:image\/png;base64,/);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect.poll(() => api.sent('PUT', `/loyalty/profile/${MEMBER.id}`).length).toBe(1);
    expect((api.sent('PUT', `/loyalty/profile/${MEMBER.id}`)[0].body as { avatar: string }).avatar)
      .toMatch(/^data:image\/png;base64,/);
  });

  test('an image over 1 MB is refused', async ({ page }) => {
    await openProfile(page);
    // The alert opens inside the change handler, so it has to be answered by a
    // listener; awaiting it after setInputFiles would deadlock.
    const messages: string[] = [];
    page.on('dialog', d => { messages.push(d.message()); void d.dismiss(); });
    await page.locator('#avatar-upload').setInputFiles({
      name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(1024 * 1024 + 1),
    });

    await expect.poll(() => messages).toEqual(['Image size must be less than 1MB']);
    await expect(page.getByAltText('Avatar')).toHaveCount(0);
  });
});

test.describe('Privacy', () => {
  test('export downloads the member\'s data as JSON', async ({ page }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Security & Privacy' }).filter({ visible: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export Data \(JSON\)/ }).click();

    const file = await download;
    expect(file.suggestedFilename()).toBe('thestudio_export_11111111.json');
    const data = JSON.parse(await readFile(await file.path(), 'utf-8')) as { profile: { userId: string; email: string } };
    expect(data.profile).toMatchObject({ userId: MEMBER.id, email: MEMBER.username });
  });

  test('deleting the account asks first, then deletes and signs out', async ({ page, api }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Security & Privacy' }).filter({ visible: true }).click();
    const messages: string[] = [];
    page.on('dialog', d => { messages.push(d.message()); void d.accept(); });
    await page.getByRole('button', { name: /Delete Account/ }).click();

    await expect.poll(() => api.sent('DELETE', `/loyalty/profile/${MEMBER.id}`).length).toBe(1);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('hc_token'))).toBeNull();
    expect(messages[0]).toMatch(/^Are you sure you want to permanently delete your account/);
    expect(messages[1]).toMatch(/^Account deletion request submitted/);
  });

  test('cancelling the delete prompt deletes nothing', async ({ page, api }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Security & Privacy' }).filter({ visible: true }).click();
    page.on('dialog', d => { void d.dismiss(); });
    await page.getByRole('button', { name: /Delete Account/ }).click();

    await expect(page.getByRole('heading', { name: 'Security & Privacy' })).toBeVisible();
    expect(api.sent('DELETE', `/loyalty/profile/${MEMBER.id}`)).toHaveLength(0);
    expect(await page.evaluate(() => sessionStorage.getItem('hc_token'))).toBe(MEMBER.token);
  });
});
