import { Router } from 'express';
import messageController from '../controllers/message.controller.ts';
import friendMiddleware from '../middlewares/friend.middleware.ts';
import { upload } from '../middlewares/upload.middleware.ts';

const router = Router();

router.post('/upload', upload.single('file'), messageController.uploadImage);
router.post('/direct', friendMiddleware.checkFriendship, messageController.sendDirectMessage);
router.post('/group', messageController.sendGroupMessage);

export default router;
