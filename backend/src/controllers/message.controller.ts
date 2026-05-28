import { Request, Response } from 'express';
import Conversation from '../models/conversation.model.ts';
import Message from '../models/message.model.ts';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.ts';
import { io } from '../socket/index.ts';
const messageController = {
    sendDirectMessage: async (req: Request, res: Response) => {
        try {
            const { recipientId, content, conversationId } = req.body;
            const senderId = req.user._id?.toString();
            let conversation;

            if (!content) {
                res.status(400).json({ message: 'Thiếu nội dung' });
                return;
            }

            if (!conversationId) {
                conversation = await Conversation.create({
                    type: 'direct',
                    participants: [
                        { userId: senderId, joinedAt: new Date() },
                        { userId: recipientId, joinedAt: new Date() },
                    ],
                    lastMessageAt: new Date(),
                });
            } else {
                conversation = await Conversation.findById(conversationId);
            }

            const message = await Message.create({
                conversationId: conversation?._id,
                senderId,
                content,
            });

            updateConversationAfterCreateMessage(conversation, message, senderId);
            conversation!!.save();
            emitNewMessage(io, conversation, message);

            res.status(200).json({ success: true, message });
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn  =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    sendGroupMessage: async (req: Request, res: Response) => {
        try {
            const { conversationId, content } = req.body;
            const senderId = req.user._id?.toString();

            if (!content) {
                res.status(400).json({ message: 'Thiếu nội dung' });
                return;
            }

            const message = await Message.create({
                conversationId,
                senderId,
                content,
            });
            //d updateConversationAfterCreateMessage(message.conversation, message, senderId);
            // emitNewMessage(io, conversation, message);

            res.status(200).json({ success: true, message });
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn nhóm  =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
};

export default messageController;
