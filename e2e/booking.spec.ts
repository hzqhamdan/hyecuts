import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { MEMBER, signInAs } from './support/mockApi';

// Monday 26 October 2026, 10:00 in Kuala Lumpur (the config pins the browser
// to that timezone). A fixed clock makes "the next Monday" a known date.
const MONDAY_MORNING = new Date('2026-10-26T10:00:00+08:00');

/** Haircuts is the category open by default; pass another to expand it first. */
async function chooseService(page: Page, name: string, category?: string) {
  await expect(page.getByRole('heading', { name: 'Select Service' })).toBeVisible();
  if (category) await page.getByRole('button', { name: category }).click();
  await page.getByRole('heading', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Barber' }).click();
}

async function chooseBarber(page: Page, name: string) {
  await page.getByRole('heading', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Schedule' }).click();
}

async function chooseSlot(page: Page, day: string, time: string) {
  await page.getByText(day, { exact: true }).click();
  await page.getByText(time, { exact: true }).click();
  await page.getByRole('button', { name: 'Review Booking' }).click();
  await expect(page.getByRole('heading', { name: 'Final Review' })).toBeVisible();
}

test.describe('Guest booking', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(MONDAY_MORNING);
  });

  test('books a haircut end to end and shows the reference', async ({ page, api }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Tuesday', '03:00 PM');

    await expect(page.getByText('RM 25', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Full Name').fill('  Farah Lee ');
    await page.getByPlaceholder('Email').fill('farah@example.com');
    await page.getByPlaceholder('Phone Number').fill('+60 13-366 6693');
    await page.getByRole('button', { name: 'Pay at Shop' }).click();

    await expect(page.getByRole('heading', { name: 'Secured' })).toBeVisible();
    await expect(page.getByText('REF: HYC-4821')).toBeVisible();

    const [booking] = api.sent('POST', '/bookings');
    expect(booking.token).toBeNull();
    expect(booking.body).toEqual({
      serviceId: 1,
      appointmentTime: '2026-10-27T15:00:00',
      guestName: 'Farah Lee',
      guestEmail: 'farah@example.com',
      guestPhone: '+60 13-366 6693',
    });
  });

  test('needs a name, a phone number and a valid email before it can be sent', async ({ page, api }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Beard Trim/Shape', 'Beard');
    await chooseBarber(page, 'No Preference');
    await chooseSlot(page, 'Wednesday', '12:30 PM');

    const payAtShop = page.getByRole('button', { name: 'Pay at Shop' });
    await page.getByPlaceholder('Full Name').fill('Farah Lee');
    await page.getByPlaceholder('Phone Number').fill('0133666693');
    await page.getByPlaceholder('Email').fill('farah@example');
    await expect(payAtShop).toBeDisabled();

    await page.getByPlaceholder('Email').fill('farah@example.com');
    await expect(payAtShop).toBeEnabled();
    await page.getByPlaceholder('Full Name').fill('   ');
    await expect(payAtShop).toBeDisabled();
    expect(api.sent('POST', '/bookings')).toHaveLength(0);
  });

  test('guests are only offered pay at shop, not the online deposit', async ({ page }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Naim');
    await chooseSlot(page, 'Monday', '05:00 PM');

    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toHaveCount(0);
    await expect(page.getByText('Guest bookings are pay-at-shop only')).toBeVisible();
  });

  test('a rejected booking keeps the customer on the review step with the reason', async ({ page, api }) => {
    api.on('POST', '/bookings', () => ({ status: 400, text: 'That slot has just been taken.' }));
    const dialog = page.waitForEvent('dialog');
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Tuesday', '03:00 PM');
    await page.getByPlaceholder('Full Name').fill('Farah Lee');
    await page.getByPlaceholder('Email').fill('farah@example.com');
    await page.getByPlaceholder('Phone Number').fill('0133666693');
    await page.getByRole('button', { name: 'Pay at Shop' }).click();

    const alert = await dialog;
    expect(alert.message()).toBe('Booking failed: That slot has just been taken.');
    await alert.dismiss();
    await expect(page.getByRole('heading', { name: 'Final Review' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Secured' })).toHaveCount(0);
  });
});

test.describe('Choosing a service', () => {
  test('a service the shop no longer offers is shown as unavailable and cannot be picked', async ({ page, api }) => {
    api.services = api.services.filter(s => s.name !== 'Kids Hair Cut');
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();

    const kids = page.locator('[aria-disabled="true"]', { hasText: 'Kids Hair Cut' });
    await expect(kids).toContainText('Unavailable');
    await kids.click({ force: true });
    await expect(page.getByRole('button', { name: 'Continue to Barber' })).toBeDisabled();
  });

  test('when the service list cannot load, nothing is selectable until a retry succeeds', async ({ page, api }) => {
    let failing = true;
    api.on('GET', '/services/active', () => (failing ? { status: 500, text: 'down' } : undefined));
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();

    await expect(page.locator('[aria-disabled="true"]', { hasText: 'Adult Hair Cut' })).toBeVisible();
    failing = false;
    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(page.locator('[aria-disabled="false"]', { hasText: 'Adult Hair Cut' })).toBeVisible();
    await chooseService(page, 'Adult Hair Cut');
    await expect(page.getByRole('heading', { name: 'Select Barber' })).toBeVisible();
  });
});

test.describe('Choosing a time', () => {
  test('Friday only offers slots from 2:30 PM, and switching day drops a time outside it', async ({ page }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');

    await page.getByText('Monday', { exact: true }).click();
    await page.getByText('12:30 PM', { exact: true }).click();
    await page.getByText('Friday', { exact: true }).click();

    await expect(page.getByText('12:30 PM', { exact: true })).toHaveCount(0);
    await expect(page.getByText('02:30 PM', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review Booking' })).toBeDisabled();
  });

  // E2E-003 (fixed): availability used to be made up. Whatever day was picked,
  // the screen marked 2 PM and 4 PM as booked without asking the server.
  test('only slots the server reports as taken are shown as booked', async ({ page, api }) => {
    await page.clock.setFixedTime(MONDAY_MORNING);
    api.takenTimes = ['2026-10-27T15:00:00']; // Tuesday, 3 PM
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await page.getByText('Tuesday', { exact: true }).click();

    // Waiting for the taken slot first means the count below is not read before
    // the answer has arrived.
    await expect(page.getByText('03:00 PM (Booked)')).toBeVisible();
    await expect(page.getByText('(Booked)')).toHaveCount(1);
    expect(api.sent('GET', '/bookings/availability/2026-10-27')).toHaveLength(1);
  });

  // E2E-004 (fixed): picking today's weekday at a time that has already passed
  // used to book today, in the past.
  test('picking today at a time that has passed books next week', async ({ page, api }) => {
    await page.clock.setFixedTime(new Date('2026-10-26T18:00:00+08:00')); // Monday, 6 PM
    await page.goto('/booking');
    await page.getByRole('button', { name: /Continue as Guest/ }).click();
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Monday', '03:00 PM');
    await page.getByPlaceholder('Full Name').fill('Farah Lee');
    await page.getByPlaceholder('Email').fill('farah@example.com');
    await page.getByPlaceholder('Phone Number').fill('0133666693');
    await page.getByRole('button', { name: 'Pay at Shop' }).click();

    await expect.poll(() => api.sent('POST', '/bookings').length).toBe(1);
    expect((api.sent('POST', '/bookings')[0].body as { appointmentTime: string }).appointmentTime)
      .toBe('2026-11-02T15:00:00');
  });
});

test.describe('Member booking', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(MONDAY_MORNING);
    await signInAs(page, MEMBER);
  });

  test('skips the guest question and books under the member', async ({ page, api }) => {
    await page.goto('/booking');
    await chooseService(page, 'Teenager Hair Cut');
    await chooseBarber(page, 'Naim');
    await chooseSlot(page, 'Saturday', '07:30 PM');

    await expect(page.getByPlaceholder('Full Name')).toHaveCount(0);
    await page.getByRole('button', { name: 'Pay at Shop' }).click();

    await expect(page.getByRole('heading', { name: 'Secured' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View My Appointments' })).toBeVisible();
    const [booking] = api.sent('POST', '/bookings');
    expect(booking.token).toBe(MEMBER.token);
    expect(booking.body).toEqual({ userId: MEMBER.id, serviceId: 4, appointmentTime: '2026-10-31T19:30:00' });
  });

  test('the deposit step asks for the chosen service and shows what the server will charge', async ({ page, api }) => {
    api.service(1).priceMyr = 25.55;
    await page.goto('/booking');
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Tuesday', '03:00 PM');
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    await expect(page.getByRole('heading', { name: 'Secure Deposit' })).toBeVisible();
    await expect(page.getByText('Deposit: RM 12.78')).toBeVisible();
    expect(api.sent('POST', '/payments/create-intent').map(r => r.body)).toEqual([{ serviceId: 1 }]);
  });

  test('a deposit that cannot be set up says so instead of spinning', async ({ page, api }) => {
    api.on('POST', '/payments/create-intent', () => ({ status: 502, json: { error: 'The payment provider is unavailable. Please try again.' } }));
    await page.goto('/booking');
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Tuesday', '03:00 PM');
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    await expect(page.getByRole('alert')).toContainText('We could not set up the deposit');
  });

  test('going back to change the service asks for a new deposit', async ({ page, api }) => {
    await page.goto('/booking');
    await chooseService(page, 'Adult Hair Cut');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Tuesday', '03:00 PM');
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();
    await expect(page.getByText('Deposit: RM 12.50')).toBeVisible();

    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Previous Step' }).click();
    await chooseService(page, 'Beard Trim/Shape', 'Beard');
    await chooseBarber(page, 'Haiqal');
    await chooseSlot(page, 'Tuesday', '03:00 PM');
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    await expect(page.getByText('Deposit: RM 5.00')).toBeVisible();
    expect(api.sent('POST', '/payments/create-intent').map(r => r.body)).toEqual([{ serviceId: 1 }, { serviceId: 8 }]);
  });
});
