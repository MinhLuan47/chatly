import { Router } from 'express';
import friendController from '../controllers/friend.controller.ts';

const router = Router();

// lấy danh sách bạn bè
router.get('/', friendController.getAllFriends);

// lấy danh sách yêu cầu kết bạn gửi và nhận
router.get('/requests', friendController.getFriendRequests);

// gửi yêu cầu kết bạn
router.post('/requests', friendController.sendFriendRequest);

// đồng ý kết bạn
router.post('/requests/:requestId/accept', friendController.acceptFriend);

// từ chối kết bạn
router.post('/requests/:requestId/reject', friendController.rejectFriend);

export default router;
