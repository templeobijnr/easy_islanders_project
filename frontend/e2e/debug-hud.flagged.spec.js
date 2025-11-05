// Run this spec only when pointing at a live backend that processes turns
// Enable with: E2E_LIVE_BACKEND=1 and build FE with VITE_DEBUG_MEMORY_HUD=true
const { test, expect } = require('@playwright/test');

const RUN_LIVE = process.env.E2E_LIVE_BACKEND === '1';

(RUN_LIVE ? test : test.skip)(
  'HUD visible with flag & cached flips on second turn',
  async ({ page }) => {
    await page.goto('/?debugHUD=1');

    await expect(page.getByTestId('debug-memory-hud')).toBeVisible();

    // Turn 1
    await page.getByRole('textbox').fill('hi');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('debug-memory-hud-used')).toHaveText('true');
    await expect(page.getByTestId('debug-memory-hud-cached')).toHaveText('false');

    // Turn 2 within 30s
    await page.getByRole('textbox').fill('hi again');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('debug-memory-hud-cached')).toHaveText('true', { timeout: 15000 });
  }
);

