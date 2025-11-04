// Debug HUD gating E2E: minimal check that HUD is hidden by default
// Run with your standard dev server (no debug flag enabled)

const { test, expect } = require('@playwright/test');

test.describe('Debug HUD', () => {
  test('is hidden by default when no flag is set', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="debug-memory-hud"]')).toHaveCount(0);
  });
});

