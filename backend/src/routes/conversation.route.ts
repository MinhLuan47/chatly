import express from 'express';
import conversationController from '../controllers/conversation.controller';
import friendMiddleware from '../middlewares/friend.middleware';

const router = express.Router();

router.post('/', friendMiddleware.checkFriendship, conversationController.createConversation);
router.get('/', conversationController.getConversations);
router.get('/:conversationId/messages', conversationController.getMessages);
router.patch('/:conversationId/seen', conversationController.markAsSeen);

export default router;
