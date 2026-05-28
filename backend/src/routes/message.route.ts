import { Router } from 'express';
import messageController from '../controllers/message.controller.ts';
import friendMiddleware from '../middlewares/friend.middleware.ts';
const router = Router();

router.post('/direct', friendMiddleware.checkFriendship, messageController.sendDirectMessage);
router.post('/group', messageController.sendGroupMessage);

export default router;
