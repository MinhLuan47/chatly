import Conversation from '../models/conversation.model.ts';
import Friend from '../models/friend.model.ts';
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
                const friendship = await Friend.findOne({ userA, userB });

                if (!friendship) {
                    res.status(403).json({ message: 'Bạn chưa kết bạn với người này' });
                    return;
                }
                next();
            }

            // chat nhóm
            const friendChecks = memberIds.map(async (id: string) => {
                const [userA, userB] = pair(me, id);
                const friend = await Friend.findOne({ userA, userB });
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
            const conversation = await Conversation.findById(conversationId);
            if (conversation?.type !== 'group') {
                res.status(400).json({ message: 'Conversation không phải nhóm' });
                return;
            }
            const memberIds = conversation.participants.map((p: any) => p.userId.toString());
            const [userA, userB] = pair(me, conversationId);
            const friend = await Friend.findOne({ userA, userB });
            if (!friend) {
                res.status(403).json({ message: 'Không thể tạo nhóm với người chưa kết bạn' });
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
