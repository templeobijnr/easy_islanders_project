import { test, expect } from '@playwright/test';

test.describe('UI Interactions and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
  });

  test('should maintain sticky header position under heavy content', async ({ page }) => {
    // Send multiple messages to create heavy content
    const messageInput = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    for (let i = 0; i < 10; i++) {
      await messageInput.fill(`Test message ${i + 1}`);
      await sendButton.click();

      // Wait for message to appear
      await page.waitForSelector(`[data-testid="user-message"]:has-text("Test message ${i + 1}")`, { timeout: 5000 });

      // Wait for assistant response
      await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 });
    }

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check that header remains sticky
    const header = page.locator('[data-testid="sticky-header"]');
    const headerPosition = await header.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, position: getComputedStyle(el).position };
    });

    expect(headerPosition.position).toBe('sticky');
    expect(headerPosition.top).toBe(0);
  });

  test('should maintain sticky composer position under heavy content', async ({ page }) => {
    // Create heavy content as above
    const messageInput = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    for (let i = 0; i < 8; i++) {
      await messageInput.fill(`Heavy content message ${i + 1}`);
      await sendButton.click();
      await page.waitForSelector(`[data-testid="user-message"]:has-text("Heavy content message ${i + 1}")`, { timeout: 5000 });
      await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 });
    }

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check composer is still accessible
    const composer = page.locator('[data-testid="message-composer"]');
    const composerVisible = await composer.isVisible();
    expect(composerVisible).toBe(true);

    // Try to interact with composer
    await messageInput.fill('Final test message');
    await sendButton.click();

    // Verify message was sent
    await page.waitForSelector('[data-testid="user-message"]:has-text("Final test message")', { timeout: 5000 });
  });

  test('should handle responsive layout changes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile menu button is visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();

    // Sidebar should be hidden by default on mobile
    const sidebar = page.locator('[data-testid="sidebar"]');
    const sidebarVisible = await sidebar.isVisible();
    expect(sidebarVisible).toBe(false);

    // Click mobile menu to open sidebar
    await mobileMenuButton.click();

    // Sidebar should now be visible
    await expect(sidebar).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });

    // Sidebar should be visible by default on desktop
    await expect(sidebar).toBeVisible();

    // Mobile menu button should be hidden
    await expect(mobileMenuButton).not.toBeVisible();
  });

  test('should handle theme switching', async ({ page }) => {
    // Check initial theme (should be dark by default)
    const body = page.locator('body');
    const initialClasses = await body.getAttribute('class');
    expect(initialClasses).toContain('dark');

    // Click theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();

    // Check theme changed to light
    const lightClasses = await body.getAttribute('class');
    expect(lightClasses).toContain('light');
    expect(lightClasses).not.toContain('dark');

    // Click again to go back to dark
    await themeToggle.click();
    const darkClasses = await body.getAttribute('class');
    expect(darkClasses).toContain('dark');
  });
});