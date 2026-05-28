import prisma from '../libs/prisma.ts';
import { Request, Response, NextFunction } from 'express';

const pair = (a: any, b: any) => (a < b ? [a, b] : [b, a]);
const friendMiddleware = {
    checkFriendship: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const me = req.user._id?.toString();
            const recipientId = req.body.recipientId ?? null;
            const memberIds = req.body.memberIds ?? [];
            if (!recipientId && memberIds.length === 0) {
                res.status(400).json({ message: 'Chưa có recipientId hoặc memberIds' });
                return;
            }

            if (recipientId) {
                const [userA, userB] = pair(me, recipientId);
                const friendship = await prisma.friend.findUnique({
                    where: {
                        userAId_userBId: {
                            userAId: userA,
                            userBId: userB
                        }
                    }
                });

                if (!friendship) {
                    res.status(403).json({ message: 'Bạn chưa kết bạn với người này' });
                    return;
                }
                next();
                return;
            }

            // chat nhóm
            const friendChecks = memberIds.map(async (id: string) => {
                const [userA, userB] = pair(me, id);
                const friend = await prisma.friend.findUnique({
                    where: {
                        userAId_userBId: {
                            userAId: userA,
                            userBId: userB
                        }
                    }
                });
                return friend ? null : id;
            });
            const friendships = await Promise.all(friendChecks);
            const result = friendships.filter(Boolean);
            if (result.length > 0) {
                res.status(403).json({ message: 'Không thể tạo nhóm với người chưa kết bạn' });
                return;
            }
            next();
        } catch (error) {
            console.error('Lỗi xảy ra khi checkFriendship =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    checkGroupMembership: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const me = req.user._id?.toString();
            const conversationId = req.body.conversationId ?? null;
            if (!conversationId) {
                res.status(400).json({ message: 'Chưa có conversationId' });
                return;
            }
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: true
                }
            });
            if (!conversation || conversation.type !== 'group') {
                res.status(400).json({ message: 'Conversation không phải nhóm' });
                return;
            }
            const isMember = conversation.participants.some((p: any) => p.userId === me);
            if (!isMember) {
                res.status(403).json({ message: 'Bạn không phải thành viên nhóm này' });
                return;
            }
            next();
        } catch (error) {
            console.error('Lỗi xảy ra khi checkGroupMembership =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
};

export default friendMiddleware;

