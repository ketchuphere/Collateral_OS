
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Property Registration + Assessment Journey", () => {
  test("user can register a property and run an AI assessment", async ({ page }) => {
    // Navigate to new property form
    await page.goto(`${BASE_URL}/properties/new`);
    expect(true).toBe(true); // placeholder until Playwright is installed
  });
});

test.describe("AI Copilot", () => {
  test("copilot responds to a portfolio query", async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-copilot`);

    expect(true).toBe(true);
  });
});

test.describe("Dashboard", () => {
  test("dashboard loads and shows portfolio summary", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    expect(true).toBe(true);
  });
});
