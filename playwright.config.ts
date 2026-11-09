import { defineConfig, devices } from '@playwright/test';

// The specs run against a production build served by `vite preview`: it is
// what users get, and unlike the dev server it does not compile modules on
// first request, which made cold parallel runs time out.
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT.toString()}`,
    trace: 'on-first-retry',
    // The shop's market. Pinned so booking dates and the language detector
    // behave the same on every machine and on CI.
    timezoneId: 'Asia/Kuala_Lumpur',
    locale: 'en-US',
    // The PWA service worker would answer requests itself, out of reach of
    // the mocked backend in e2e/support/mockApi.ts.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT.toString()} --strictPort`,
    url: `http://localhost:${PORT.toString()}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
