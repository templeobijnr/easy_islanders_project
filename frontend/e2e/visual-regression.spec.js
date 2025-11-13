import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match homepage visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for critical content to load
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="featured-carousel"]', { timeout: 10000 });

    // Verify PageTransition wrapper by allowing transition to complete
    await page.waitForTimeout(500); // Allow transition to start

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

    // Mock slow API response to trigger skeleton loaders
    await page.route('**/api/messages', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: [] });
    });

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

    // Verify responsive spacing
    await page.waitForTimeout(500); // Allow responsive adjustments

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

    await page.waitForTimeout(250); // Wait for theme transition to start
    await expect(page).toHaveScreenshot('dark-theme-transition.png', {
      fullPage: true,
      threshold: 0.1,
    });

    await page.waitForTimeout(250); // Wait for theme transition to complete

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

  test('should validate page transitions', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Navigate to dashboard to trigger page transition
    await page.click('[data-testid="dashboard-link"]'); // Assuming there's a link

    // Capture mid-transition state
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('page-transition-mid.png', {
      fullPage: true,
      threshold: 0.1,
    });

    // Wait for transition to complete
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should validate skeleton loaders', async ({ page }) => {
    await page.goto('http://localhost:3000/bookings'); // Page with skeleton loaders

    // Mock slow API response
    await page.route('**/api/bookings', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({ json: [] });
    });

    await page.reload();

    // Capture skeleton state
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('skeleton-loaders.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should validate button micro-interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const premiumButton = page.locator('[data-testid="premium-button"]');

    // Hover state
    await premiumButton.hover();
    await expect(page).toHaveScreenshot('button-hover.png', {
      threshold: 0.1,
    });

    // Press state
    await page.mouse.down();
    await expect(page).toHaveScreenshot('button-press.png', {
      threshold: 0.1,
    });
  });

  test('should validate card hover effects', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const card = page.locator('[data-testid="recommendation-card"]').first();

    // Hover state
    await card.hover();
    await expect(page).toHaveScreenshot('card-hover.png', {
      threshold: 0.1,
    });
  });

  test('should validate modal entrance animations', async ({ page }) => {
    await page.goto('http://localhost:3000/bookings');

    // Open a modal
    await page.click('[data-testid="booking-details-button"]');

    // Capture mid-animation
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('modal-entrance-mid.png', {
      threshold: 0.1,
    });

    // Wait for animation to complete
    await page.waitForTimeout(700);
    await expect(page).toHaveScreenshot('modal-entrance-complete.png', {
      threshold: 0.1,
    });
  });

  test('should validate stagger animations', async ({ page }) => {
    await page.goto('http://localhost:3000/bookings');

    // Capture mid-stagger state
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('stagger-mid.png', {
      fullPage: true,
      threshold: 0.1,
    });

    // Wait for stagger to complete
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('stagger-complete.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should validate loading states', async ({ page }) => {
    await page.goto('http://localhost:3000/create-listing');

    // Trigger form submission
    await page.click('[data-testid="publish-button"]');

    // Capture loading state
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('loading-state.png', {
      threshold: 0.1,
    });
  });

  test('should validate spacing consistency', async ({ page }) => {
    // Take screenshots of multiple pages for comparison
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="chat-input"]');
    await expect(page).toHaveScreenshot('homepage-spacing.png', {
      fullPage: true,
      threshold: 0.1,
    });

    await page.goto('http://localhost:3000/bookings');
    await page.waitForSelector('[data-testid="bookings-list"]');
    await expect(page).toHaveScreenshot('bookings-spacing.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should validate semantic colors', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Capture components with different variants
    await expect(page).toHaveScreenshot('semantic-colors.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('should validate animation performance', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Start performance monitoring
    await page.evaluate(() => {
      window.framesPerSecond = [];
      let lastTime = performance.now();
      const measureFPS = () => {
        const now = performance.now();
        const fps = 1000 / (now - lastTime);
        window.framesPerSecond.push(fps);
        lastTime = now;
        requestAnimationFrame(measureFPS);
      };
      requestAnimationFrame(measureFPS);
    });

    // Trigger animations
    await page.hover('[data-testid="card"]');
    await page.waitForTimeout(1000);

    // Check average FPS
    const fpsArray = await page.evaluate(() => window.framesPerSecond);
    const avgFPS = fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length;
    expect(avgFPS).toBeGreaterThan(50); // Should maintain >50fps
  });

  test('should validate accessibility - prefers-reduced-motion', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('http://localhost:3000');

    // Verify animations are reduced or disabled
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('reduced-motion.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});
