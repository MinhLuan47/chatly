import { io } from '../socket/index.ts';
import { Request, Response } from 'express';
import Conversation from '../models/conversation.model.ts';
import mongoose from 'mongoose';
import Message from '../models/message.model.ts';

const conversationController = {
    createConversation: async (req: Request, res: Response) => {
        try {
            const { type, name, memberIds } = req.body;
            const userId = req.user._id?.toString();

            if (
                !type ||
                (type === 'group' && !name) ||
                !memberIds ||
                Array.isArray(memberIds) ||
                memberIds.length === 0
            ) {
                res.status(400).json({ message: 'Tên nhóm và danh sách thành viên là bắt buộc' });
                return;
            }
            let conversation;
            if (type === 'direct') {
                const participantId = memberIds[0];
                conversation = await Conversation.findOne({
                    type: 'direct',
                    'participants.userId': { $all: [userId, participantId] },
                });
                if (!conversation) {
                    conversation = new Conversation({
                        type: 'direct',
                        participants: [
                            { userId: userId, joinedAt: new Date() },
                            { userId: participantId, joinedAt: new Date() },
                        ],
                        lastMessageAt: new Date(),
                    });
                    await conversation.save();
                }
            }

            if (type === 'group') {
                conversation = new Conversation({
                    type: 'group',
                    group: {
                        name,
                        createdBy: userId,
                    },
                    participants: [
                        { userId: new mongoose.Types.ObjectId(userId), joinedAt: new Date() },
                        ...memberIds.map((id: string) => ({
                            userId: new mongoose.Types.ObjectId(id),
                            joinedAt: new Date(),
                        })),
                    ],
                    lastMessageAt: new Date(),
                });
                await conversation.save();
            }
            if (!conversation) {
                res.status(400).json({ message: 'Conversation type không hợp lệ' });
                return;
            }

            await conversation.populate([
                {
                    path: 'participants.userId',
                    select: '_id displayName avatarUrl',
                },
                {
                    path: 'seenBy',
                    select: '_id displayName avatarUrl',
                },
                {
                    path: 'lastMessage.senderId',
                    select: '_id displayName avatarUrl',
                },
            ]);
            const participants = (conversation.participants || []).map((p: any) => ({
                _id: p.userId._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            const formatted = {
                ...conversation.toObject(),
                unreadCounts: conversation.unreadCounts || {},
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
            const conversations = await Conversation.find({
                'participants.userId': userId,
            })
                .sort({ lastMessageAt: -1, updatedAt: -1 })
                .populate([
                    {
                        path: 'participants.userId',
                        select: '_id displayName avatarUrl',
                    },
                    {
                        path: 'seenBy',
                        select: '_id displayName avatarUrl',
                    },
                    {
                        path: 'lastMessage.senderId',
                        select: '_id displayName avatarUrl',
                    },
                ]);
            const formattedConversations = conversations.map((conver) => {
                const participants = (conver.participants || []).map((p: any) => ({
                    _id: p.userId._id,
                    displayName: p.userId?.displayName,
                    avatarUrl: p.userId?.avatarUrl ?? null,
                    joinedAt: p.joinedAt,
                }));

                return {
                    ...conver.toObject(),
                    unreadCounts: conver.unreadCounts || {},
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
            const query: any = { conversationId };

            if (cursor) {
                query.createdAt = { $lt: new Date(cursor.toString()) };
            }

            let messages = await Message.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit) + 1);

            let nextCursor = null;

            if (messages.length > Number(limit)) {
                nextCursor = messages[messages.length - 1].createdAt.toISOString();
                messages.pop();
            }
            messages = messages.reverse();

            res.status(200).json({ success: true, messages, nextCursor });
        } catch (error) {
            console.log('Lỗi tại conversationController, getMessages =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getUserConversationIds: async (userId: string) => {
        try {
            const conversations = await Conversation.find(
                {
                    'participants.userId': userId,
                },
                { _id: 1 },
            );
            return conversations.map((conver) => conver._id.toString());
        } catch (error) {
            console.log('Lỗi tại conversationController, getUserConversationIds =>', error);
            return [];
        }
    },
    markAsSeen: async (req: Request, res: Response) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user._id?.toString();

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                res.status(404).json({ message: 'Không tìm thấy conversation' });
                return;
            }

            const lastMessage = conversation.lastMessage;

            if (!lastMessage) {
                res.status(200).json({ message: 'Không có tin nhắn để mark as seen' });
                return;
            }

            if (lastMessage.senderId?.toString() === userId) {
                res.status(200).json({ message: 'Sender không cần mark as seen' });
                return;
            }

            const updated = await Conversation.findByIdAndUpdate(
                conversationId,
                {
                    $addToSet: { seenBy: userId },
                    $set: { [`unreadCounts.${userId}`]: 0 },
                },
                {
                    new: true,
                },
            );

            io.to(conversationId).emit('readMessage', {
                conversation: updated,
                lastMessage: {
                    _id: updated?.lastMessage?._id,
                    content: updated?.lastMessage?.content,
                    createdAt: updated?.lastMessage?.createdAt,
                    senderId: {
                        _id: updated?.lastMessage?._id,
                    },
                },
            });

            res.status(200).json({
                success: true,
                message: 'Mark as seen ',
                seenBy: updated?.seenBy || [],
                myUnreadCount: updated?.unreadCounts?.[userId] || 0,
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
