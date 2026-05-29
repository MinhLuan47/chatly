import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Direct message and image upload E2E tests between two users', async ({ browser }) => {
    // 1. Create dummy image for testing upload
    const testDir = path.join(process.cwd(), 'tests', 'temp');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    const testImagePath = path.join(testDir, 'test-image.png');
    // Create a minimal 1x1 transparent PNG
    const dummyPngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );
    fs.writeFileSync(testImagePath, dummyPngBuffer);

    // 2. Initialize two browser contexts representing the two users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 3. User A login (luanbui)
    await pageA.goto('/');
    await pageA.fill('input#username', 'luanbui');
    await pageA.fill('input#password', 'luan@1234567');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/');

    // 4. User B login (luanbui47)
    await pageB.goto('/');
    await pageB.fill('input#username', 'luanbui47');
    await pageB.fill('input#password', 'luan@1234567');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/');

    // 5. Open chat conversation on both browsers
    // For User A: Open chat with User B (luanbui47 / display name: luan bui)
    const userBCard = pageA.locator('h3', { hasText: 'luan bui' }).or(pageA.locator('span', { hasText: 'luan bui' }));
    if (await userBCard.count() > 0) {
        await userBCard.first().click();
    } else {
        await pageA.click('text=Gửi tin nhắn mới');
        await pageA.waitForSelector('text=Danh sách bạn bè');
        await pageA.locator('span:has-text("luanbui47")').or(pageA.locator('span:has-text("Luanbui47")')).first().click();
    }

    // For User B: Open chat with User A (luanbui / display name: Luân Bùi)
    const userACard = pageB.locator('h3', { hasText: 'Luân Bùi' }).or(pageB.locator('span', { hasText: 'Luân Bùi' }));
    if (await userACard.count() > 0) {
        await userACard.first().click();
    } else {
        await pageB.click('text=Gửi tin nhắn mới');
        await pageB.waitForSelector('text=Danh sách bạn bè');
        await pageB.locator('span:has-text("luanbui")').or(pageB.locator('span:has-text("Luanbui")')).first().click();
    }

    // Wait for chat windows to load
    await pageA.waitForSelector('[data-testid="message-input"]');
    await pageB.waitForSelector('[data-testid="message-input"]');

    // 6. Test Real-time text message sending from User A to User B
    const uniqueTextMessage = `Hello from User A - ${Date.now()}`;
    await pageA.fill('[data-testid="message-input"]', uniqueTextMessage);
    await pageA.press('[data-testid="message-input"]', 'Enter');

    // Verify User A sees their own sent message
    const messageCardA = pageA.locator('[data-testid="message-card"]', { hasText: uniqueTextMessage });
    await expect(messageCardA.first()).toBeVisible();

    // Verify User B receives it in real-time
    const messageCardB = pageB.locator('[data-testid="message-card"]', { hasText: uniqueTextMessage });
    await expect(messageCardB.first()).toBeVisible({ timeout: 10000 });

    // 7. Test Real-time image message sending from User A to User B
    // Select image using input[type="file"]
    const fileChooserPromise = pageA.waitForEvent('filechooser');
    await pageA.click('[data-testid="upload-image-btn"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);

    // Wait for preview to be visible
    await expect(pageA.locator('img[alt="Preview"]')).toBeVisible();

    // Send the image
    await pageA.click('[data-testid="send-msg-btn"]');

    // Verify User A sees the sent image
    await expect(pageA.locator('[data-testid="chat-message-image"]').first()).toBeVisible({ timeout: 15000 });

    // Verify User B receives the image in real-time
    await expect(pageB.locator('[data-testid="chat-message-image"]').first()).toBeVisible({ timeout: 15000 });

    // 8. Test scrolling behavior
    // Scroll the chat body up to load older messages
    const scrollDiv = pageA.locator('#scrollableDiv');
    await scrollDiv.evaluate((el) => {
        el.scrollTop = 0; // scroll to top to trigger loading older messages
    });
    // Wait for a small duration to ensure scroll event handles correctly
    await pageA.waitForTimeout(1000);

    // Cleanup contexts and temp image
    await contextA.close();
    await contextB.close();
    if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
    }
});
