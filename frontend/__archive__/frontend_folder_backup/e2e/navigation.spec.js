import { test, expect } from '@playwright/test';

test.describe('Navigation and UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
  });

  test('should navigate carousel with keyboard', async ({ page }) => {
    // Wait for featured content to load
    await page.waitForSelector('[data-testid="featured-carousel"]', { timeout: 10000 });

    const carousel = page.locator('[data-testid="featured-carousel"]');

    // Get initial scroll position
    const initialScroll = await carousel.evaluate(el => el.scrollLeft);

    // Press right arrow key
    await page.keyboard.press('ArrowRight');

    // Wait a bit for animation
    await page.waitForTimeout(500);

    // Check if carousel scrolled
    const afterScroll = await carousel.evaluate(el => el.scrollLeft);
    expect(afterScroll).toBeGreaterThan(initialScroll);
  });

  test('should scroll carousel with mouse', async ({ page }) => {
    await page.waitForSelector('[data-testid="featured-carousel"]', { timeout: 10000 });

    const carousel = page.locator('[data-testid="featured-carousel"]');

    // Get initial scroll position
    const initialScroll = await carousel.evaluate(el => el.scrollLeft);

    // Scroll with mouse wheel
    await carousel.hover();
    await page.mouse.wheel(0, 100);

    // Wait for scroll
    await page.waitForTimeout(500);

    // Check if carousel scrolled
    const afterScroll = await carousel.evaluate(el => el.scrollLeft);
    expect(afterScroll).toBeGreaterThan(initialScroll);
  });

  test('should cycle through spotlight tabs', async ({ page }) => {
    // Wait for tab navigation to load
    await page.waitForSelector('[data-testid="spotlight-tabs"]', { timeout: 10000 });

    const tabs = page.locator('[data-testid="spotlight-tab"]');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(1);

    // Click each tab and verify content changes
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      await tab.click();

      // Wait for content to update
      await page.waitForTimeout(300);

      // Verify tab is active
      await expect(tab).toHaveAttribute('data-active', 'true');

      // Verify corresponding content is visible
      const content = page.locator(`[data-testid="tab-content-${i}"]`);
      await expect(content).toBeVisible();
    }
  });

  test('should handle tab switching with keyboard', async ({ page }) => {
    await page.waitForSelector('[data-testid="spotlight-tabs"]', { timeout: 10000 });

    const firstTab = page.locator('[data-testid="spotlight-tab"]').first();

    // Focus first tab
    await firstTab.focus();

    // Press Tab to move to next tab
    await page.keyboard.press('Tab');

    // Check that focus moved
    const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(activeElement).toContain('spotlight-tab');
  });
});