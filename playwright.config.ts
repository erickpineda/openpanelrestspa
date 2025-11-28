import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4201',
    viewport: { width: 1280, height: 800 },
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run start:mem -- --port 4201',
    url: 'http://localhost:4201/',
    reuseExistingServer: true,
    timeout: 120000
  }
});
