import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3100;
const baseURL = `http://localhost:${PORT}`;

// In sandboxes where Playwright's bundled browser isn't downloaded, point at a
// preinstalled Chromium via PW_CHROMIUM_PATH. In normal CI, `playwright install`
// provides the browser and this stays unset.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "npm run db:push && npm run db:seed && npm run build && npm run start -- -p " +
      PORT,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL: "file:./e2e.db",
      AUTH_SECRET: "e2e-test-secret-please-change",
    },
  },
});
