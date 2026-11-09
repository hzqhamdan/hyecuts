import { test, expect } from './support/test';
import { ADMIN, MEMBER, signInAs } from './support/mockApi';

async function fillCredentials(page: import('@playwright/test').Page, username: string, password: string) {
  await page.getByPlaceholder('Enter your identifier').fill(username);
  await page.getByPlaceholder('Enter your sequence').fill(password);
}

test.describe('Sign in', () => {
  test('a member lands in the lounge with a stored session', async ({ page, api }) => {
    await page.goto('/login');
    await fillCredentials(page, MEMBER.username, 'correct-horse');
    await page.getByRole('button', { name: 'Authenticate' }).click();

    await expect(page).toHaveURL('/lounge');
    await expect(page.getByRole('navigation').getByText('The Member Lounge').filter({ visible: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Insider' })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('hc_token'))).toBe(MEMBER.token);
    expect(api.sent('POST', '/auth/login')[0].body).toEqual({ username: MEMBER.username, password: 'correct-horse' });
    // The lounge loads the signed-in member's own data with their token.
    await expect.poll(() => api.sent('GET', `/loyalty/profile/${MEMBER.id}`)[0]?.token).toBe(MEMBER.token);
  });

  test('an admin lands in the atelier', async ({ page }) => {
    await page.goto('/login');
    await fillCredentials(page, ADMIN.username, 'owner-pass');
    await page.getByRole('button', { name: 'Authenticate' }).click();

    await expect(page).toHaveURL('/admin/bookings');
  });

  test('wrong credentials show an error and keep the visitor signed out', async ({ page }) => {
    await page.goto('/login');
    await fillCredentials(page, MEMBER.username, 'wrong');
    await page.getByRole('button', { name: 'Authenticate' }).click();

    await expect(page.getByText('Network error or server unreachable')).toBeVisible();
    await expect(page).toHaveURL('/login');
    expect(await page.evaluate(() => sessionStorage.getItem('hc_token'))).toBeNull();
  });

  test('an unreachable server shows the same error instead of hanging', async ({ page, api }) => {
    api.on('POST', '/auth/login', () => ({ status: 503, text: 'Service Unavailable' }));
    await page.goto('/login');
    await fillCredentials(page, MEMBER.username, 'correct-horse');
    await page.getByRole('button', { name: 'Authenticate' }).click();

    await expect(page.getByText('Network error or server unreachable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Authenticate' })).toBeEnabled();
  });

  test('both fields are required before anything is sent', async ({ page, api }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Authenticate' }).click();

    await expect(page).toHaveURL('/login');
    expect(api.sent('POST', '/auth/login')).toHaveLength(0);
  });
});

test.describe('Registration', () => {
  test('cannot be submitted without PDPA consent', async ({ page, api }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'New? Establish Profile' }).click();
    await fillCredentials(page, 'new@example.com', 'a-long-password');

    const submit = page.getByRole('button', { name: 'Establish Profile' });
    await expect(submit).toBeDisabled();

    await page.getByLabel('I acknowledge the PDPA conditions for data handling.').check();
    await submit.click();

    await expect(page).toHaveURL('/lounge');
    expect(api.sent('POST', '/auth/register')[0].body).toEqual({ username: 'new@example.com', password: 'a-long-password' });
  });
});

test.describe('Sign out', () => {
  test('clears the session, revokes the token and locks the lounge again', async ({ page, api }) => {
    await signInAs(page, MEMBER);
    await page.goto('/lounge');
    await page.getByRole('button', { name: 'Logout' }).first().click();

    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('hc_token'))).toBeNull();
    await expect.poll(() => api.sent('POST', '/auth/logout')[0]?.token).toBe(MEMBER.token);

    await page.goto('/lounge');
    await expect(page).toHaveURL('/login');
  });

  // E2E-001: the lounge's guard sees the cleared token and redirects to
  // /login before the handler's navigate('/') lands, so a member who signs
  // out is shown the sign-in form instead of the home page.
  test('returns to the home page', async ({ page }) => {
    test.fail();
    await signInAs(page, MEMBER);
    await page.goto('/lounge');
    await page.getByRole('button', { name: 'Logout' }).first().click();

    await expect(page).toHaveURL('/');
  });
});

test.describe('Route protection', () => {
  for (const path of ['/lounge', '/my-bookings', '/admin', '/admin/members']) {
    test(`a visitor opening ${path} is sent to sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL('/login');
    });
  }

  test('a member opening the atelier is sent back to the lounge', async ({ page, api }) => {
    await signInAs(page, MEMBER);
    await page.goto('/admin/members');

    await expect(page).toHaveURL('/lounge');
    expect(api.sent('GET', '/admin/users')).toHaveLength(0);
  });
});
