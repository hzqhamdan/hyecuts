import { test as base, expect } from '@playwright/test';
import { MockApi } from './mockApi';

/** Every spec gets a fresh mock backend, installed before the first navigation. */
export const test = base.extend<{ api: MockApi }>({
  api: [async ({ page }, use) => {
    const api = new MockApi();
    await api.install(page);
    await use(api);
  }, { auto: true }],
});

export { expect };
