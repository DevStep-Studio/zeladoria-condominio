import { defineConfig, devices } from "@playwright/test";

export const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "mobile-360", width: 360, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "mobile-375", width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "mobile-390", width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: "mobile-414", width: 414, height: 896, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: "mobile-430", width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: "tablet-768", width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "tablet-820", width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "tablet-1024", width: 1024, height: 768, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
  { name: "desktop-1280", width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { name: "desktop-1440", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { name: "desktop-1920", width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: VIEWPORTS.map((vp) => ({
    name: vp.name,
    use: {
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    },
  })),
});
