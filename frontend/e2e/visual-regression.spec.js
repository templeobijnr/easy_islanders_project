import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match homepage visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for critical content to load
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="featured-carousel"]', { timeout: 10000 });

    // Wait a bit more for any animations to complete
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should match chat interface visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('[data-testid="chat-container"]', { timeout: 10000 });

    // Take screenshot of chat area specifically
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toHaveScreenshot('chat-interface.png', {
      threshold: 0.1,
    });
  });

  test('should match sidebar visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });

    // Take screenshot of sidebar
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toHaveScreenshot('sidebar.png', {
      threshold: 0.1,
    });
  });

  test('should match featured content visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('[data-testid="featured-section"]', { timeout: 10000 });

    // Take screenshot of featured content area
    const featuredSection = page.locator('[data-testid="featured-section"]');
    await expect(featuredSection).toHaveScreenshot('featured-content.png', {
      threshold: 0.1,
    });
  });

  test('should match mobile layout visual snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });

    // Take full page screenshot for mobile
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should match dark theme visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('[data-testid="theme-toggle"]', { timeout: 10000 });

    // Ensure we're in dark theme (default)
    const body = page.locator('body');
    const classes = await body.getAttribute('class');
    if (!classes?.includes('dark')) {
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      await themeToggle.click();
      await themeToggle.click(); // Click twice to ensure dark theme
    }

    await page.waitForTimeout(500); // Wait for theme transition

    await expect(page).toHaveScreenshot('dark-theme.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should match light theme visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('[data-testid="theme-toggle"]', { timeout: 10000 });

    // Switch to light theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();

    await page.waitForTimeout(500); // Wait for theme transition

    await expect(page).toHaveScreenshot('light-theme.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});