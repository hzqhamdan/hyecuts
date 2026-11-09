import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { ADMIN, MEMBER, signInAs } from './support/mockApi';

function booking(id: string, who: { user: unknown; guestName?: string }, status = 'PENDING') {
  return {
    id,
    ...who,
    service: { id: 1, name: 'Adult Hair Cut' },
    appointmentTime: '2026-10-27T15:00:00',
    status,
    totalPriceMyr: 25,
    createdAt: '2026-10-25T09:12:00',
  };
}

/** Collects uncaught page errors, so a section that crashes fails its test. */
function pageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', e => errors.push(e));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await signInAs(page, ADMIN);
});

test.describe('Atelier', () => {
  test('opens on the booking manager and every section renders', async ({ page }) => {
    const errors = pageErrors(page);
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin/bookings');
    await expect(page.getByRole('heading', { name: 'Active Bookings' })).toBeVisible();

    const sections: [string, string][] = [
      ['Member Manager', 'Member Manager'],
      ['Staff Roster', 'Staff Roster'],
      ['Review Queue', 'Review Queue'],
      ['Loyalty Config', 'Economy Center'],
      ['Analytics', 'Atelier Overview'],
    ];
    for (const [link, heading] of sections) {
      await page.getByRole('link', { name: link }).click();
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('signing out ends the session and locks the atelier', async ({ page, api }) => {
    await page.goto('/admin/bookings');
    await page.getByRole('button', { name: 'Sign Out & Exit' }).click();

    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('hc_token'))).toBeNull();
    await expect.poll(() => api.sent('POST', '/auth/logout')[0]?.token).toBe(ADMIN.token);
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });

  // E2E-001, as for members: the guard redirects to /login first.
  test('signing out returns to the home page', async ({ page }) => {
    test.fail();
    await page.goto('/admin/bookings');
    await page.getByRole('button', { name: 'Sign Out & Exit' }).click();

    await expect(page).toHaveURL('/');
  });
});

test.describe('Booking manager', () => {
  test('completing a booking awards it and moves it off the pending list', async ({ page, api }) => {
    api.allBookings = [booking('b-1', { user: { email: MEMBER.username, fullName: 'Aiman Rahman' } })];
    await page.goto('/admin/bookings');

    await expect(page.getByRole('heading', { name: 'Aiman Rahman' })).toBeVisible();
    await expect(page.getByText('RM 25')).toBeVisible();
    await page.getByRole('button', { name: 'Complete & Award Points' }).click();

    await expect(page.getByText('No Pending Appointments')).toBeVisible();
    expect(api.sent('PUT', '/bookings/b-1/complete')[0].token).toBe(ADMIN.token);
  });

  // E2E-006: guest bookings have no user (the backend sends "user": null),
  // and the list reads booking.user.fullName, so one guest booking blanks the
  // whole booking manager.
  test('lists a guest booking under the guest name', async ({ page, api }) => {
    test.fail();
    const errors = pageErrors(page);
    api.allBookings = [booking('b-2', { user: null, guestName: 'Farah Lee' })];
    await page.goto('/admin/bookings');

    await expect(page.getByRole('heading', { name: 'Farah Lee' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Member manager', () => {
  test('finds a member and adjusts their points', async ({ page, api }) => {
    await page.goto('/admin/members');
    await page.getByPlaceholder('Search by name or email...').fill('aiman');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('240');
    await rows.first().getByRole('button').click();

    await expect(page.getByRole('heading', { name: 'Aiman Rahman' })).toBeVisible();
    const confirm = page.getByRole('button', { name: 'Confirm Adjustment' });
    await expect(confirm).toBeDisabled();
    await page.getByRole('slider').fill('150');
    await expect(page.getByText('+150')).toBeVisible();
    await confirm.click();

    await expect.poll(() => api.sent('POST', `/admin/points/adjust/${MEMBER.id}`).length).toBe(1);
    expect(api.sent('POST', `/admin/points/adjust/${MEMBER.id}`)[0].query.get('points')).toBe('150');
    // The list behind the drawer refetches with the new balance.
    await expect(rows.first()).toContainText('390');
  });

  // E2E-005: after an adjustment the drawer copies the member from the list
  // as it was before the refetch, so the balance it shows stays at the old
  // figure until the drawer is closed and reopened.
  test('the open drawer shows the new balance after an adjustment', async ({ page }) => {
    test.fail();
    await page.goto('/admin/members');
    await page.locator('tbody tr', { hasText: 'Aiman Rahman' }).getByRole('button').click();
    await page.getByRole('slider').fill('150');
    await page.getByRole('button', { name: 'Confirm Adjustment' }).click();

    await expect(page.locator('p.font-serif', { hasText: /^390$/ })).toBeVisible();
  });
});

test.describe('Economy center', () => {
  test('changing the point ratio and multiplier saves them and shows the saved values', async ({ page, api }) => {
    await page.goto('/admin/loyalty');
    await expect(page.getByText('1 pts')).toBeVisible();
    await expect(page.getByText('1x')).toBeVisible();

    const [ratio, multiplier] = await page.getByRole('slider').all();
    await ratio.fill('5');
    await expect(page.getByText('5 pts')).toBeVisible();
    await multiplier.fill('1.5');
    await expect(page.getByText('1.5x')).toBeVisible();

    expect(api.settings).toEqual({ POINTS_PER_MYR: '5', SEASONAL_MULTIPLIER: '1.5' });
    expect(api.sent('POST', '/admin/settings').every(r => r.token === ADMIN.token)).toBe(true);
  });

  test('a manual adjustment reports success, and an error for an unknown member', async ({ page, api }) => {
    await page.goto('/admin/loyalty');
    const target = page.getByPlaceholder('Membership ID or Email');
    const amount = page.getByPlaceholder('Amount (+ or -)');
    const apply = page.getByRole('button', { name: /Apply Adjustment/ });

    await target.fill(MEMBER.id);
    await amount.fill('-40');
    await apply.click();
    await expect(apply).toHaveText('Apply Adjustment (Success)');
    expect(api.member(MEMBER.id).currentPoints).toBe(200);

    await target.fill('not-a-member');
    await apply.click();
    await expect(apply).toHaveText('Apply Adjustment (Error)');
  });
});
