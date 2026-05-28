import { io } from '../socket/index.ts';
import { Request, Response } from 'express';
import prisma from '../libs/prisma.ts';

const conversationController = {
    createConversation: async (req: Request, res: Response) => {
        try {
            const { type, name, memberIds } = req.body;
            const userId = req.user._id?.toString();

            if (
                !type ||
                (type === 'group' && !name) ||
                !memberIds ||
                !Array.isArray(memberIds) ||
                memberIds.length === 0
            ) {
                res.status(400).json({ message: 'Tên nhóm và danh sách thành viên là bắt buộc' });
                return;
            }
            let conversation;
            if (type === 'direct') {
                const participantId = memberIds[0];
                conversation = await prisma.conversation.findFirst({
                    where: {
                        type: 'direct',
                        AND: [
                            { participants: { some: { userId } } },
                            { participants: { some: { userId: participantId } } }
                        ]
                    },
                    include: {
                        participants: {
                            include: {
                                user: { select: { id: true, displayName: true, avatarUrl: true } }
                            }
                        },
                        lastMessage: {
                            include: {
                                sender: { select: { id: true, displayName: true, avatarUrl: true } }
                            }
                        }
                    }
                });

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            type: 'direct',
                            lastMessageAt: new Date(),
                        },
                        include: {
                            participants: {
                                include: {
                                    user: { select: { id: true, displayName: true, avatarUrl: true } }
                                }
                            },
                            lastMessage: {
                                include: {
                                    sender: { select: { id: true, displayName: true, avatarUrl: true } }
                                }
                            }
                        }
                    });

                    await prisma.participant.createMany({
                        data: [
                            { conversationId: conversation.id, userId: userId! },
                            { conversationId: conversation.id, userId: participantId }
                        ]
                    });

                    // Re-fetch populated conversation
                    conversation = await prisma.conversation.findUnique({
                        where: { id: conversation.id },
                        include: {
                            participants: {
                                include: {
                                    user: { select: { id: true, displayName: true, avatarUrl: true } }
                                }
                            },
                            lastMessage: {
                                include: {
                                    sender: { select: { id: true, displayName: true, avatarUrl: true } }
                                }
                            }
                        }
                    }) || conversation;
                }
            }

            if (type === 'group') {
                conversation = await prisma.conversation.create({
                    data: {
                        type: 'group',
                        name,
                        createdById: userId,
                        lastMessageAt: new Date(),
                    },
                    include: {
                        participants: {
                            include: {
                                user: { select: { id: true, displayName: true, avatarUrl: true } }
                            }
                        },
                        lastMessage: {
                            include: {
                                sender: { select: { id: true, displayName: true, avatarUrl: true } }
                            }
                        }
                    }
                });

                const allMemberIds = Array.from(new Set([userId!, ...memberIds]));
                await prisma.participant.createMany({
                    data: allMemberIds.map((id: string) => ({
                        conversationId: conversation!.id,
                        userId: id,
                    }))
                });

                // Re-fetch populated conversation
                conversation = await prisma.conversation.findUnique({
                    where: { id: conversation.id },
                    include: {
                        participants: {
                            include: {
                                user: { select: { id: true, displayName: true, avatarUrl: true } }
                            }
                        },
                        lastMessage: {
                            include: {
                                sender: { select: { id: true, displayName: true, avatarUrl: true } }
                            }
                        }
                    }
                }) || conversation;
            }

            if (!conversation) {
                res.status(400).json({ message: 'Conversation type không hợp lệ' });
                return;
            }

            const participants = (conversation.participants || []).map((p: any) => ({
                _id: p.userId,
                displayName: p.user?.displayName,
                avatarUrl: p.user?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            const seenBy = (conversation.participants || [])
                .filter((p: any) => p.lastSeenAt && conversation!.lastMessageAt && p.lastSeenAt >= conversation!.lastMessageAt)
                .map((p: any) => ({
                    _id: p.userId,
                    displayName: p.user?.displayName,
                    avatarUrl: p.user?.avatarUrl ?? null,
                }));

            const unreadCounts: Record<string, number> = {};
            (conversation.participants || []).forEach((p: any) => {
                unreadCounts[p.userId] = p.unreadCount;
            });

            const formatted = {
                _id: conversation.id,
                id: conversation.id,
                type: conversation.type,
                name: conversation.name,
                group: conversation.type === 'group' ? {
                    name: conversation.name,
                    createdBy: conversation.createdById,
                    avatarUrl: conversation.groupAvatarUrl,
                } : null,
                lastMessageAt: conversation.lastMessageAt,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                lastMessage: conversation.lastMessage ? {
                    _id: conversation.lastMessage.id,
                    content: conversation.lastMessage.content,
                    createdAt: conversation.lastMessage.createdAt,
                    senderId: conversation.lastMessage.sender ? {
                        _id: conversation.lastMessage.senderId,
                        displayName: conversation.lastMessage.sender.displayName,
                        avatarUrl: conversation.lastMessage.sender.avatarUrl,
                    } : null
                } : null,
                seenBy,
                unreadCounts,
                participants,
            };

            if (type === 'group') {
                memberIds.forEach((id: string) => {
                    io.to(id).emit('newGroup', formatted);
                });
            }

            res.status(201).json({ success: true, conversation: formatted });
        } catch (error) {
            console.log('Lỗi tại conversationController, createConversation =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getConversations: async (req: Request, res: Response) => {
        try {
            const userId = req.user._id?.toString();
            
            const userParticipants = await prisma.participant.findMany({
                where: { userId },
                select: { conversationId: true }
            });
            const conversationIds = userParticipants.map(up => up.conversationId);

            const conversations = await prisma.conversation.findMany({
                where: { id: { in: conversationIds } },
                orderBy: [
                    { lastMessageAt: 'desc' },
                    { updatedAt: 'desc' }
                ],
                include: {
                    participants: {
                        include: {
                            user: { select: { id: true, displayName: true, avatarUrl: true } }
                        }
                    },
                    lastMessage: {
                        include: {
                            sender: { select: { id: true, displayName: true, avatarUrl: true } }
                        }
                    }
                }
            });

            const formattedConversations = conversations.map((conver) => {
                const participants = (conver.participants || []).map((p: any) => ({
                    _id: p.userId,
                    displayName: p.user?.displayName,
                    avatarUrl: p.user?.avatarUrl ?? null,
                    joinedAt: p.joinedAt,
                }));

                const seenBy = (conver.participants || [])
                    .filter((p: any) => p.lastSeenAt && conver.lastMessageAt && p.lastSeenAt >= conver.lastMessageAt)
                    .map((p: any) => ({
                        _id: p.userId,
                        displayName: p.user?.displayName,
                        avatarUrl: p.user?.avatarUrl ?? null,
                    }));

                const unreadCounts: Record<string, number> = {};
                (conver.participants || []).forEach((p: any) => {
                    unreadCounts[p.userId] = p.unreadCount;
                });

                return {
                    _id: conver.id,
                    id: conver.id,
                    type: conver.type,
                    name: conver.name,
                    group: conver.type === 'group' ? {
                        name: conver.name,
                        createdBy: conver.createdById,
                        avatarUrl: conver.groupAvatarUrl,
                    } : null,
                    lastMessageAt: conver.lastMessageAt,
                    createdAt: conver.createdAt,
                    updatedAt: conver.updatedAt,
                    lastMessage: conver.lastMessage ? {
                        _id: conver.lastMessage.id,
                        content: conver.lastMessage.content,
                        createdAt: conver.lastMessage.createdAt,
                        senderId: conver.lastMessage.sender ? {
                            _id: conver.lastMessage.senderId,
                            displayName: conver.lastMessage.sender.displayName,
                            avatarUrl: conver.lastMessage.sender.avatarUrl,
                        } : null
                    } : null,
                    seenBy,
                    unreadCounts,
                    participants,
                };
            });

            res.status(200).json({ success: true, conversations: formattedConversations });
        } catch (error) {
            console.log('Lỗi tại conversationController, getConversations =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getMessages: async (req: Request, res: Response) => {
        try {
            const { conversationId } = req.params;
            const { limit = 50, cursor } = req.query;
            
            const take = Number(limit) + 1;
            const queryOptions: any = {
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
                take
            };

            if (cursor) {
                queryOptions.cursor = { id: cursor.toString() };
                queryOptions.skip = 1;
            }

            let messages = await prisma.message.findMany(queryOptions);
            let nextCursor = null;

            if (messages.length > Number(limit)) {
                nextCursor = messages[messages.length - 1].id;
                messages.pop();
            }
            messages = messages.reverse();

            const formattedMessages = messages.map(m => ({ ...m, _id: m.id }));

            res.status(200).json({ success: true, messages: formattedMessages, nextCursor });
        } catch (error) {
            console.log('Lỗi tại conversationController, getMessages =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getUserConversationIds: async (userId: string) => {
        try {
            const participants = await prisma.participant.findMany({
                where: { userId },
                select: { conversationId: true }
            });
            return participants.map((p) => p.conversationId);
        } catch (error) {
            console.log('Lỗi tại conversationController, getUserConversationIds =>', error);
            return [];
        }
    },
    markAsSeen: async (req: Request, res: Response) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user._id?.toString();

            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    lastMessage: true
                }
            });
            if (!conversation) {
                res.status(404).json({ message: 'Không tìm thấy conversation' });
                return;
            }

            const lastMessage = conversation.lastMessage;

            if (!lastMessage) {
                res.status(200).json({ message: 'Không có tin nhắn để mark as seen' });
                return;
            }

            if (lastMessage.senderId === userId) {
                res.status(200).json({ message: 'Sender không cần mark as seen' });
                return;
            }

            // Update participant lastSeenAt and reset unreadCount
            await prisma.participant.update({
                where: {
                    conversationId_userId: {
                        conversationId,
                        userId: userId!
                    }
                },
                data: {
                    unreadCount: 0,
                    lastSeenAt: lastMessage.createdAt
                }
            });

            // Re-fetch conversation to construct updated state
            const updatedConversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: {
                        include: {
                            user: { select: { id: true, displayName: true, avatarUrl: true } }
                        }
                    },
                    lastMessage: {
                        include: {
                            sender: { select: { id: true, displayName: true, avatarUrl: true } }
                        }
                    }
                }
            });

            const participants = (updatedConversation!.participants || []).map((p: any) => ({
                _id: p.userId,
                displayName: p.user?.displayName,
                avatarUrl: p.user?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            const seenBy = (updatedConversation!.participants || [])
                .filter((p: any) => p.lastSeenAt && updatedConversation!.lastMessageAt && p.lastSeenAt >= updatedConversation!.lastMessageAt)
                .map((p: any) => ({
                    _id: p.userId,
                    displayName: p.user?.displayName,
                    avatarUrl: p.user?.avatarUrl ?? null,
                }));

            const unreadCounts: Record<string, number> = {};
            (updatedConversation!.participants || []).forEach((p: any) => {
                unreadCounts[p.userId] = p.unreadCount;
            });

            const formattedConversation = {
                _id: updatedConversation!.id,
                id: updatedConversation!.id,
                type: updatedConversation!.type,
                name: updatedConversation!.name,
                group: updatedConversation!.type === 'group' ? {
                    name: updatedConversation!.name,
                    createdBy: updatedConversation!.createdById,
                    avatarUrl: updatedConversation!.groupAvatarUrl,
                } : null,
                lastMessageAt: updatedConversation!.lastMessageAt,
                createdAt: updatedConversation!.createdAt,
                updatedAt: updatedConversation!.updatedAt,
                lastMessage: updatedConversation!.lastMessage ? {
                    _id: updatedConversation!.lastMessage.id,
                    content: updatedConversation!.lastMessage.content,
                    createdAt: updatedConversation!.lastMessage.createdAt,
                    senderId: updatedConversation!.lastMessage.sender ? {
                        _id: updatedConversation!.lastMessage.senderId,
                        displayName: updatedConversation!.lastMessage.sender.displayName,
                        avatarUrl: updatedConversation!.lastMessage.sender.avatarUrl,
                    } : null
                } : null,
                seenBy,
                unreadCounts,
                participants,
            };

            io.to(conversationId).emit('readMessage', {
                conversation: formattedConversation,
                lastMessage: {
                    _id: updatedConversation!.lastMessage?.id,
                    content: updatedConversation!.lastMessage?.content,
                    createdAt: updatedConversation!.lastMessage?.createdAt,
                    senderId: {
                        _id: updatedConversation!.lastMessage?.senderId,
                    },
                },
            });

            res.status(200).json({
                success: true,
                message: 'Mark as seen ',
                seenBy,
                myUnreadCount: 0,
            });
        } catch (error) {
            console.log('Lỗi tại conversationController, markAsSeen =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    updateConversation: async (req: Request, res: Response) => {},
    deleteConversation: async (req: Request, res: Response) => {},
};

export default conversationController;

