import { Request, Response } from 'express';
import prisma from '../libs/prisma.ts';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.ts';
import { io } from '../socket/index.ts';
import { uploadMessageImageFromBuffer } from '../middlewares/upload.middleware.ts';

const messageController = {
    uploadImage: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            if (!file) {
                res.status(400).json({ message: 'file is required' });
                return;
            }

            const result = (await uploadMessageImageFromBuffer(file.buffer, {})) as { secure_url: string; public_id: string };

            if (!result || !result.secure_url) {
                res.status(400).json({ message: 'Lỗi tải ảnh lên Cloudinary' });
                return;
            }

            res.status(200).json({ success: true, imageUrl: result.secure_url });
        } catch (error) {
            console.error('Lỗi upload ảnh chat =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống khi upload ảnh' });
        }
    },

    sendDirectMessage: async (req: Request, res: Response) => {
        try {
            const { recipientId, content, conversationId, imgUrl } = req.body;
            const senderId = req.user.id;
            let conversation;

            if (!content && !imgUrl) {
                res.status(400).json({ message: 'Thiếu nội dung hoặc ảnh' });
                return;
            }

            if (!conversationId) {
                // Find existing direct conversation between these two participants
                const existingConversations = await prisma.conversation.findMany({
                    where: {
                        type: 'direct',
                        participants: {
                            some: { userId: senderId }
                        }
                    },
                    include: {
                        participants: true
                    }
                });

                const existing = existingConversations.find((c) =>
                    c.participants.some((p) => p.userId === recipientId)
                );

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
                    content: content || null,
                    imageUrl: imgUrl || null,
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
            const { conversationId, content, imgUrl } = req.body;
            const senderId = req.user.id;

            if (!content && !imgUrl) {
                res.status(400).json({ message: 'Thiếu nội dung hoặc ảnh' });
                return;
            }

            const message = await prisma.message.create({
                data: {
                    conversationId,
                    senderId: senderId!,
                    content: content || null,
                    imageUrl: imgUrl || null,
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

