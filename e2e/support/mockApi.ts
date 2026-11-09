import type { Page, Request, Route } from '@playwright/test';

/**
 * An in-memory stand-in for the Spring backend. The specs drive the real
 * frontend in a real browser, and every request it makes to /api/** is
 * answered from here, so they need no database, Stripe account or running
 * backend. Each test gets its own state; tests change it through the
 * returned object and read back the requests the app actually sent.
 */

export const MEMBER = {
  id: '11111111-1111-1111-1111-111111111111',
  username: 'member@example.com',
  role: 'ROLE_USER',
  token: 'member-jwt',
} as const;

export const ADMIN = {
  id: '99999999-9999-9999-9999-999999999999',
  username: 'owner@hyecuts.com',
  role: 'ROLE_ADMIN',
  token: 'admin-jwt',
} as const;

export interface ServiceRow { id: number; name: string; priceMyr: number; durationMinutes: number; isActive: boolean }

export interface MemberRow {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  dob: string;
  tier: string;
  currentPoints: number;
  lifetimePoints: number;
}

export interface SentRequest { method: string; path: string; query: URLSearchParams; body: unknown; token: string | null }

interface Reply { status?: number; json?: unknown; text?: string }
type Handler = (req: SentRequest) => Reply | undefined;

function defaultServices(): ServiceRow[] {
  return [
    { id: 1, name: 'Adult Hair Cut', priceMyr: 25, durationMinutes: 30, isActive: true },
    { id: 4, name: 'Teenager Hair Cut', priceMyr: 20, durationMinutes: 30, isActive: true },
    { id: 5, name: 'Senior Citizen Hair Cut', priceMyr: 15, durationMinutes: 30, isActive: true },
    { id: 7, name: 'Kids Hair Cut', priceMyr: 15, durationMinutes: 30, isActive: true },
    { id: 8, name: 'Beard Trim/Shape', priceMyr: 10, durationMinutes: 10, isActive: true },
  ];
}

function defaultMembers(): MemberRow[] {
  return [
    {
      id: MEMBER.id, email: MEMBER.username, fullName: 'Aiman Rahman', phone: '+60 12-345 6789',
      dob: '1995-04-12', tier: 'INSIDER', currentPoints: 240, lifetimePoints: 400,
    },
    {
      id: '22222222-2222-2222-2222-222222222222', email: 'siti@example.com', fullName: 'Siti Aminah', phone: '',
      dob: '1990-01-01', tier: 'MEMBER', currentPoints: 50, lifetimePoints: 50,
    },
  ];
}

export class MockApi {
  services = defaultServices();
  members = defaultMembers();
  settings: Record<string, string> = { POINTS_PER_MYR: '1', SEASONAL_MULTIPLIER: '1.0' };
  /** What GET /bookings/all returns, shaped like the backend's Booking entity. */
  allBookings: unknown[] = [];
  /** Credentials accepted by /auth/login, keyed by username. */
  accounts = new Map<string, { password: string; user: { id: string; role: string; token: string } }>([
    [MEMBER.username, { password: 'correct-horse', user: MEMBER }],
    [ADMIN.username, { password: 'owner-pass', user: ADMIN }],
  ]);
  requests: SentRequest[] = [];
  private overrides: { method: string; path: string | RegExp; handler: Handler }[] = [];
  private nextBookingId = 4821;

  /** Answer one endpoint differently for this test, e.g. to make it fail. */
  on(method: string, path: string | RegExp, handler: Handler) {
    this.overrides.unshift({ method, path, handler });
  }

  sent(method: string, path: string | RegExp): SentRequest[] {
    return this.requests.filter(r => r.method === method && (typeof path === 'string' ? r.path === path : path.test(r.path)));
  }

  service(id: number): ServiceRow {
    const row = this.services.find(s => s.id === id);
    if (!row) throw new Error(`no service ${String(id)}`);
    return row;
  }

  member(id: string): MemberRow {
    const row = this.members.find(m => m.id === id);
    if (!row) throw new Error(`no member ${id}`);
    return row;
  }

  async install(page: Page) {
    // Stripe.js is never loaded: the deposit step is exercised up to the point
    // where the card form would mount, which needs a real Stripe account.
    await page.route(/^https:\/\/([a-z]+\.)?stripe\.(com|network)\//, route => route.abort());
    await page.route(url => url.pathname.startsWith('/api/'), (route, request) => this.handle(route, request));
  }

  private async handle(route: Route, request: Request) {
    const url = new URL(request.url());
    const auth = request.headers().authorization as string | undefined;
    let body: unknown = null;
    const raw = request.postData();
    if (raw) {
      try { body = JSON.parse(raw); } catch { body = raw; }
    }
    const sent: SentRequest = {
      method: request.method(),
      path: url.pathname.replace(/^\/api/, ''),
      query: url.searchParams,
      body,
      token: auth?.startsWith('Bearer ') ? auth.slice(7) : null,
    };
    this.requests.push(sent);

    const override = this.overrides.find(o => o.method === sent.method
      && (typeof o.path === 'string' ? o.path === sent.path : o.path.test(sent.path)));
    const reply = override?.handler(sent) ?? this.respond(sent)
      ?? { status: 404, json: { message: `No mock for ${sent.method} ${sent.path}` } };

    await route.fulfill({
      status: reply.status ?? 200,
      headers: { 'access-control-allow-origin': '*' },
      ...(reply.text !== undefined
        ? { contentType: 'text/plain', body: reply.text }
        : { contentType: 'application/json', body: JSON.stringify(reply.json ?? {}) }),
    });
  }

  private respond(req: SentRequest): Reply | undefined {
    const { method, path } = req;
    let m: RegExpMatchArray | null;

    if (method === 'POST' && path === '/auth/login') {
      const { username, password } = req.body as { username: string; password: string };
      const account = this.accounts.get(username);
      if (account?.password !== password) return { status: 401, json: { message: 'Invalid credentials' } };
      return { json: { token: account.user.token, userId: account.user.id, role: account.user.role } };
    }
    if (method === 'POST' && path === '/auth/register') {
      const { username, password } = req.body as { username: string; password: string };
      if (this.accounts.has(username)) return { status: 400, json: { message: 'Username is already taken' } };
      const user = { id: '33333333-3333-3333-3333-333333333333', role: 'ROLE_USER', token: 'new-member-jwt' };
      this.accounts.set(username, { password, user });
      return { json: { token: user.token, userId: user.id, role: user.role } };
    }
    if (method === 'POST' && path === '/auth/logout') return { status: 204, text: '' };

    if (method === 'GET' && path === '/services/active') return { json: this.services.filter(s => s.isActive) };
    if (method === 'POST' && path === '/bookings') return { json: { id: this.nextBookingId++, status: 'PENDING' } };
    if (method === 'GET' && path.startsWith('/bookings/user/')) return { json: [] };
    if (method === 'GET' && path === '/bookings/all') return { json: this.allBookings };
    if (method === 'PUT' && (m = /^\/bookings\/([\w-]+)\/complete$/.exec(path))) {
      const id = m[1];
      const booking = this.allBookings.find(b => (b as { id: string }).id === id) as { status: string } | undefined;
      if (!booking) return { status: 404, json: { message: 'Booking not found' } };
      booking.status = 'COMPLETED';
      return { json: booking };
    }

    if (method === 'POST' && path === '/payments/create-intent') {
      const { serviceId } = req.body as { serviceId: number };
      const service = this.services.find(s => s.id === serviceId);
      if (!service) return { status: 404, json: { message: 'Service not found' } };
      return { json: { clientSecret: `pi_${String(serviceId)}_secret_test`, depositAmount: (service.priceMyr / 2).toFixed(2) } };
    }

    if ((m = /^\/loyalty\/profile\/([\w-]+)$/.exec(path))) {
      const id = m[1];
      const row = this.members.find(r => r.id === id);
      if (!row) return { status: 404, json: { message: 'User not found' } };
      if (method === 'GET') return { json: { ...row, username: row.email } };
      if (method === 'PUT') {
        const update = req.body as Partial<MemberRow>;
        if (update.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email)) {
          return { status: 400, json: { message: 'Please enter a valid email address.' } };
        }
        Object.assign(row, { fullName: update.fullName, email: update.email, phone: update.phone, dob: update.dob });
        return { json: { ...row } };
      }
      if (method === 'DELETE') return { status: 204, text: '' };
    }
    if (method === 'GET' && path === '/rewards') {
      return { json: [{ id: 'r-1', title: 'Complimentary Hair Cut', description: null, pointsCost: 200, minTier: null, stockCount: null, isActive: true }] };
    }
    if (method === 'GET' && path.startsWith('/gamification/')) return { json: [] };

    if (method === 'GET' && path === '/admin/users') return { json: this.members };
    if (method === 'POST' && (m = /^\/admin\/points\/adjust\/([\w-]+)$/.exec(path))) {
      const id = m[1];
      const row = this.members.find(r => r.id === id);
      if (!row) return { status: 404, json: { message: 'User not found' } };
      const points = Number(req.query.get('points'));
      row.currentPoints += points;
      if (points > 0) row.lifetimePoints += points;
      return { json: { ...row } };
    }
    if (method === 'GET' && (m = /^\/admin\/settings\/(\w+)$/.exec(path))) return { text: this.settings[m[1]] ?? '' };
    if (method === 'POST' && path === '/admin/settings') {
      this.settings[req.query.get('key') ?? ''] = req.query.get('value') ?? '';
      return { status: 200, text: '' };
    }
    if (method === 'GET' && path === '/admin/activity') return { json: [] };
    if (method === 'GET' && path === '/analytics/summary') {
      return {
        json: {
          tierDistribution: { MEMBER: 12, INSIDER: 5, ARTISAN: 2 },
          servicePopularity: { 'Adult Hair Cut': 40, 'Beard Trim/Shape': 11 },
          dailyData: [
            { date: '2026-10-24', revenue: 320, appointments: 13 },
            { date: '2026-10-25', revenue: 410, appointments: 16 },
          ],
        },
      };
    }

    return undefined;
  }
}

/** Starts the page already signed in, the way AuthProvider restores a session. */
export async function signInAs(page: Page, who: { id: string; username: string; role: string; token: string }) {
  await page.addInitScript((u) => {
    // Init scripts rerun on every load; seed once so a sign-out survives a reload.
    if (window.sessionStorage.getItem('e2e_seeded')) return;
    window.sessionStorage.setItem('e2e_seeded', '1');
    window.sessionStorage.setItem('hc_token', u.token);
    window.sessionStorage.setItem('hc_user', JSON.stringify({ id: u.id, role: u.role, username: u.username }));
  }, who);
}
