import { Request, Response } from 'express';
import prisma from '../libs/prisma.ts';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.ts';
import { io } from '../socket/index.ts';

const messageController = {
    sendDirectMessage: async (req: Request, res: Response) => {
        try {
            const { recipientId, content, conversationId } = req.body;
            const senderId = req.user.id;
            let conversation;

            if (!content) {
                res.status(400).json({ message: 'Thiếu nội dung' });
                return;
            }

            if (!conversationId) {
                // Find existing direct conversation between these two participants
                const existing = await prisma.conversation.findFirst({
                    where: {
                        type: 'direct',
                        AND: [
                            { participants: { some: { userId: senderId } } },
                            { participants: { some: { userId: recipientId } } }
                        ]
                    }
                });

                if (existing) {
                    conversation = existing;
                } else {
                    conversation = await prisma.conversation.create({
                        data: {
                            type: 'direct',
                            lastMessageAt: new Date(),
                        }
                    });

                    // Create Participant records for both users
                    await prisma.participant.createMany({
                        data: [
                            { conversationId: conversation.id, userId: senderId! },
                            { conversationId: conversation.id, userId: recipientId }
                        ]
                    });
                }
            } else {
                conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId }
                });
            }

            if (!conversation) {
                res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
                return;
            }

            const message = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: senderId!,
                    content,
                }
            });

            await updateConversationAfterCreateMessage(conversation.id, message, senderId!);
            await emitNewMessage(io, conversation.id, message, senderId!);

            res.status(200).json({ success: true, message });
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn  =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    sendGroupMessage: async (req: Request, res: Response) => {
        try {
            const { conversationId, content } = req.body;
            const senderId = req.user.id;

            if (!content) {
                res.status(400).json({ message: 'Thiếu nội dung' });
                return;
            }

            const message = await prisma.message.create({
                data: {
                    conversationId,
                    senderId: senderId!,
                    content,
                }
            });

            await updateConversationAfterCreateMessage(conversationId, message, senderId!);
            await emitNewMessage(io, conversationId, message, senderId!);

            res.status(200).json({ success: true, message });
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn nhóm  =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
};

export default messageController;

