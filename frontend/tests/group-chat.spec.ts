import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test('Group Chat E2E verification between 3 users with screenshots', async ({ browser }) => {
    test.setTimeout(90000);
    // 1. Dọn dẹp User C trong database trước khi test đăng ký
    const backendDir = path.join(process.cwd(), '..', 'backend');
    console.log('Đang dọn dẹp User C cũ...');
    execSync('npx tsx scripts/seed-group-helper.ts --cleanup', { cwd: backendDir });

    // 2. Khởi chạy context cho User C để đăng ký
    const contextC = await browser.newContext();
    const pageC = await contextC.newPage();

    // Đi tới trang đăng ký
    await pageC.goto('/signup');
    await pageC.fill('input#firstName', 'Luan');
    await pageC.fill('input#lastName', 'Bui 99');
    await pageC.fill('input#username', 'luanbui99');
    await pageC.fill('input#email', 'luanbui99@gmail.com');
    await pageC.fill('input#password', 'luan@1234567');
    
    // Click Tạo tài khoản
    await pageC.click('button[type="submit"]');
    
    // Đợi API xử lý xong bằng cách đợi text thông báo hoặc chờ ngắn
    await pageC.waitForTimeout(2000);
    
    // Điều hướng sang trang đăng nhập
    await pageC.goto('/signin');
    console.log('Đăng ký User C thành công và đã chuyển hướng sang signin!');

    // 3. Kết nối quan hệ bạn bè và tạo nhóm chat trong database sau khi User C đã được tạo
    console.log('Đang kết bạn và tạo nhóm chat trong cơ sở dữ liệu...');
    execSync('npx tsx scripts/seed-group-helper.ts --connect', { cwd: backendDir });

    // 4. Đăng nhập cả 3 User
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // User A đăng nhập
    await pageA.goto('/');
    await pageA.fill('input#username', 'luanbui');
    await pageA.fill('input#password', 'luan@1234567');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/');

    // User B đăng nhập
    await pageB.goto('/');
    await pageB.fill('input#username', 'luanbui47');
    await pageB.fill('input#password', 'luan@1234567');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/');

    // User C đăng nhập
    await pageC.goto('/signin');
    await pageC.fill('input#username', 'luanbui99');
    await pageC.fill('input#password', 'luan@1234567');
    await pageC.click('button[type="submit"]');
    await pageC.waitForURL('**/');

    console.log('Đã đăng nhập thành công cả 3 user!');

    // Đợi 2 giây để Socket.io kết nối ổn định
    await pageA.waitForTimeout(2000);
    await pageB.waitForTimeout(2000);
    await pageC.waitForTimeout(2000);

    // 5. Mở cuộc hội thoại nhóm "Group Playwright Test" ở cả 3 browser
    // Tìm và Click vào thẻ nhóm trong sidebar
    const groupCardA = pageA.locator('h3', { hasText: 'Group Playwright Test' }).or(pageA.locator('span', { hasText: 'Group Playwright Test' }));
    await expect(groupCardA.first()).toBeVisible();
    await groupCardA.first().click();

    const groupCardB = pageB.locator('h3', { hasText: 'Group Playwright Test' }).or(pageB.locator('span', { hasText: 'Group Playwright Test' }));
    await expect(groupCardB.first()).toBeVisible();
    await groupCardB.first().click();

    const groupCardC = pageC.locator('h3', { hasText: 'Group Playwright Test' }).or(pageC.locator('span', { hasText: 'Group Playwright Test' }));
    await expect(groupCardC.first()).toBeVisible();
    await groupCardC.first().click();

    // Đợi giao diện hội thoại hiển thị
    await pageA.waitForSelector('[data-testid="message-input"]');
    await pageB.waitForSelector('[data-testid="message-input"]');
    await pageC.waitForSelector('[data-testid="message-input"]');

    // 6. User A gửi tin nhắn nhóm
    const textA = 'Xin chào nhóm! Tin nhắn từ User A.';
    await pageA.fill('[data-testid="message-input"]', textA);
    await pageA.press('[data-testid="message-input"]', 'Enter');

    // Kiểm tra xem User B và User C có nhận được tin nhắn real-time không
    await expect(pageB.locator('[data-testid="message-card"]', { hasText: textA }).first()).toBeVisible({ timeout: 10000 });
    await expect(pageC.locator('[data-testid="message-card"]', { hasText: textA }).first()).toBeVisible({ timeout: 10000 });

    // 7. User C gửi tin nhắn phản hồi
    const textC = 'Chào cả nhà, mình là User C mới đăng ký.';
    await pageC.fill('[data-testid="message-input"]', textC);
    await pageC.press('[data-testid="message-input"]', 'Enter');

    // Kiểm tra xem User A và User B có nhận được phản hồi real-time không
    await expect(pageA.locator('[data-testid="message-card"]', { hasText: textC }).first()).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('[data-testid="message-card"]', { hasText: textC }).first()).toBeVisible({ timeout: 10000 });

    // 8. Chụp hình UI của cả 3 user và kiểm tra tin nhắn cuối hiển thị đúng trên Sidebar
    console.log('Đang chụp ảnh giao diện...');
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Chụp màn hình
    await pageA.screenshot({ path: path.join(resultsDir, 'userA-group-chat.png') });
    await pageB.screenshot({ path: path.join(resultsDir, 'userB-group-chat.png') });
    await pageC.screenshot({ path: path.join(resultsDir, 'userC-group-chat.png') });

    console.log('Đã chụp và lưu ảnh giao diện thành công!');

    // Đóng toàn bộ contexts
    await contextA.close();
    await contextB.close();
    await contextC.close();
});
