import { Request, Response } from 'express';
import prisma from '../libs/prisma.ts';
import { io } from '../socket/index.ts';

const friendController = {
    sendFriendRequest: async (req: Request, res: Response) => {
        try {
            const { to, message } = req.body;
            const from = req.user.id;

            if (from === to) {
                res.status(400).json({ message: 'Không thể gửi lời mời cho chính mình' });
                return;
            }
            const userExists = await prisma.user.count({ where: { id: to } });
            if (userExists === 0) {
                res.status(400).json({ message: 'Không tìm thấy người dùng' });
                return;
            }

            let userA = from?.toString();
            let userB = to.toString();
            if (userA! > userB) {
                [userA, userB] = [userB, userA!];
            }

            const [alreadyFriends, existingRequest] = await Promise.all([
                prisma.friend.findUnique({
                    where: {
                        userAId_userBId: {
                            userAId: userA!,
                            userBId: userB
                        }
                    }
                }),
                prisma.friendRequest.findFirst({
                    where: {
                        OR: [
                            { fromId: from!, toId: to },
                            { fromId: to, toId: from! }
                        ]
                    }
                })
            ]);

            if (alreadyFriends) {
                res.status(400).json({ message: 'Hai người đã là bạn bè' });
                return;
            }

            if (existingRequest) {
                res.status(400).json({ message: 'Đã có lời mời kết bạn đang chờ' });
                return;
            }

            const request = await prisma.friendRequest.create({
                data: {
                    fromId: from!,
                    toId: to,
                    message: message || null
                }
            });

            res.status(201).json({
                success: true,
                request,
                message: 'Gửi lời mời kết bạn thành công'
            });
        } catch (error) {
            console.error('Lỗi khi gửi lời mời kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    acceptFriend: async (req: Request, res: Response) => {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            const request = await prisma.friendRequest.findUnique({
                where: { id: requestId }
            });
            if (!request) {
                res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
                return;
            }

            if (request.toId !== userId) {
                res.status(400).json({ message: 'Bạn không có quyền chấp nhận lời mời kết bạn này' });
                return;
            }

            // Sắp xếp ID bạn bè theo thứ tự bảng chữ cái để tạo duy nhất
            const [sortedA, sortedB] = request.fromId < request.toId ? [request.fromId, request.toId] : [request.toId, request.fromId];

            const friend = await prisma.friend.create({
                data: {
                    userAId: sortedA,
                    userBId: sortedB
                }
            });

            await prisma.friendRequest.delete({
                where: { id: requestId }
            });

            const fromUser = await prisma.user.findUnique({
                where: { id: request.fromId },
                select: { id: true, displayName: true, avatarUrl: true }
            });

            // Tự động tạo cuộc hội thoại trực tiếp giữa hai người nếu chưa tồn tại
            const existingConversations = await prisma.conversation.findMany({
                where: {
                    type: 'direct',
                    participants: {
                        some: { userId: sortedA }
                    }
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

            let conversation = existingConversations.find((c) =>
                c.participants.some((p) => p.userId === sortedB)
            );

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
                        { conversationId: conversation.id, userId: sortedA },
                        { conversationId: conversation.id, userId: sortedB }
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

            const participants = (conversation.participants || []).map((p: any) => ({
                id: p.userId,
                displayName: p.user?.displayName,
                avatarUrl: p.user?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            const seenBy = (conversation.participants || [])
                .filter((p: any) => p.lastSeenAt && conversation!.lastMessageAt && p.lastSeenAt >= conversation!.lastMessageAt)
                .map((p: any) => ({
                    id: p.userId,
                    displayName: p.user?.displayName,
                    avatarUrl: p.user?.avatarUrl ?? null,
                }));

            const unreadCounts: Record<string, number> = {};
            (conversation.participants || []).forEach((p: any) => {
                unreadCounts[p.userId] = p.unreadCount;
            });

            const formattedConversation = {
                id: conversation.id,
                type: conversation.type,
                name: conversation.name,
                group: null,
                lastMessageAt: conversation.lastMessageAt,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                lastMessage: conversation.lastMessage ? {
                    id: conversation.lastMessage.id,
                    content: conversation.lastMessage.content,
                    createdAt: conversation.lastMessage.createdAt,
                    senderId: conversation.lastMessage.sender ? {
                        id: conversation.lastMessage.senderId,
                        displayName: conversation.lastMessage.sender.displayName,
                        avatarUrl: conversation.lastMessage.sender.avatarUrl,
                    } : null
                } : null,
                seenBy,
                unreadCounts,
                participants,
            };

            // Phát sự kiện socket để cập nhật giao diện của người gửi kết bạn
            const otherUserId = request.fromId === userId ? request.toId : request.fromId;
            io.to(otherUserId).emit('newGroup', formattedConversation);

            res.status(200).json({
                success: true,
                friend,
                from: fromUser || null,
                message: 'Chấp nhận lời mời kết bạn thành công',
                newFriend: {
                    id: fromUser?.id,
                    displayName: fromUser?.displayName,
                    avatarUrl: fromUser?.avatarUrl,
                },
                conversation: formattedConversation,
            });
        } catch (error) {
            console.error('Lỗi khi chấp nhận lời mời kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    rejectFriend: async (req: Request, res: Response) => {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;
            const request = await prisma.friendRequest.findUnique({
                where: { id: requestId }
            });

            if (!request) {
                res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
                return;
            }

            if (request.toId !== userId) {
                res.status(403).json({ message: 'Bạn không có quyền từ chối lời mời kết bạn này' });
                return;
            }

            await prisma.friendRequest.delete({
                where: { id: requestId }
            });
            res.status(200).json({ success: true, message: 'Xóa lời mời kết bạn thành công' });
        } catch (error) {
            console.error('Lỗi khi từ chối lời mời kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getAllFriends: async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const friendships = await prisma.friend.findMany({
                where: {
                    OR: [
                        { userAId: userId },
                        { userBId: userId }
                    ]
                },
                include: {
                    userA: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
                    userB: { select: { id: true, displayName: true, username: true, avatarUrl: true } }
                }
            });

            if (!friendships.length) {
                res.status(200).json({ friends: [] });
                return;
            }

            const friends = friendships.map((friendship) => {
                const uA = friendship.userA;
                const uB = friendship.userB;
                return friendship.userAId === userId ? uB : uA;
            });

            res.status(200).json({ success: true, friends, message: 'Lấy danh sách bạn bè thành công' });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bạn bè =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getFriendRequests: async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const [sentRequests, receivedRequests] = await Promise.all([
                prisma.friendRequest.findMany({
                    where: { fromId: userId },
                    include: {
                        to: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
                    }
                }),
                prisma.friendRequest.findMany({
                    where: { toId: userId },
                    include: {
                        from: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
                    }
                }),
            ]);

            const sent = sentRequests.map(r => ({
                ...r,
                id: r.id,
                from: r.fromId,
                to: r.to
            }));

            const received = receivedRequests.map(r => ({
                ...r,
                id: r.id,
                to: r.toId,
                from: r.from
            }));

            res.status(200).json({
                success: true,
                sent,
                received,
                message: 'Danh sách yêu cầu kết bạn đã gửi và đã nhận',
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách yêu cầu kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
};

export default friendController;

