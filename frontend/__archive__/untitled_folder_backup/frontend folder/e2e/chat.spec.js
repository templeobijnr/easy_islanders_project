import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
  });

  test('should send message and receive assistant reply', async ({ page }) => {
    // Type a message
    const messageInput = page.locator('[data-testid="chat-input"]');
    await messageInput.fill('Hello, I need help finding a hotel in North Cyprus');

    // Click send button
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    // Wait for user message to appear
    await page.waitForSelector('[data-testid="user-message"]');

    // Wait for assistant reply (this might take a moment due to API call)
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 });

    // Verify assistant responded
    const assistantMessages = page.locator('[data-testid="assistant-message"]');
    await expect(assistantMessages.first()).toBeVisible();

    // Check that the response contains some expected content
    const responseText = await assistantMessages.first().textContent();
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(10);
  });

  test('should handle empty message gracefully', async ({ page }) => {
    // Try to send empty message
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    // Button should be disabled or no action should occur
    const userMessages = page.locator('[data-testid="user-message"]');
    const count = await userMessages.count();
    expect(count).toBe(0);
  });

  test('should show loading state while sending', async ({ page }) => {
    const messageInput = page.locator('[data-testid="chat-input"]');
    await messageInput.fill('Test message');

    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    // Check for loading indicator
    await page.waitForSelector('[data-testid="loading-indicator"]', { timeout: 5000 });
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible();

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 });
    await expect(loadingIndicator).not.toBeVisible();
  });
});