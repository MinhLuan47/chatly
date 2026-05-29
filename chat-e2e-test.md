# Chat E2E Testing Plan

Tài liệu này lưu trữ kịch bản kiểm thử tự động và kế hoạch sửa đổi mã nguồn.

## Các đầu việc chính
- [x] Bổ sung API upload ảnh `/api/messages/upload` ở backend
- [x] Cập nhật API gửi tin nhắn (`/api/messages/direct` và `/api/messages/group`) hỗ trợ nhận và lưu `imageUrl`
- [x] Bổ sung UI chọn file ảnh và upload ở `MessageInput.tsx`
- [x] Hiển thị hình ảnh tin nhắn ở `MessageItem.tsx`
- [x] Cấu hình Playwright và viết file kịch bản E2E test `frontend/tests/chat.spec.ts`
- [x] Thực hiện chạy thử nghiệm kịch bản test để xác minh tự động
- [x] Xác minh thủ công và hoàn thành dự án

## Success Criteria
- Hai người dùng có thể gửi tin nhắn văn bản và hình ảnh real-time qua socket.io.
- Playwright E2E test chạy tự động thành công 100%.
- Infinite scroll tin nhắn hoạt động chính xác khi cuộn lên.
