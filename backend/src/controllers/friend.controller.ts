import { Request, Response } from 'express';
import Friend from '../models/friend.model.ts';
import FriendRequest from '../models/friend-request.model.ts';
import User from '../models/user.model.ts';

const friendController = {
    sendFriendRequest: async (req: Request, res: Response) => {
        try {
            const { to, message } = req.body;
            const from = req.user._id?.toString();

            if (from === to) {
                res.status(400).json({ message: 'Không thể gửi lời mời cho chính tình' });
                return;
            }
            const userExists = await User.exists({ _id: to });
            if (!userExists) {
                res.status(400).json({ message: 'Không tìm thấy người dùng' });
                return;
            }

            let userA = from?.toString();
            let userB = to.toString();
            if (userA!! > userB) {
                [userA, userB] = [userB, userA];
            }

            const [alreadyFriends, existingRequest] = await Promise.all([
                Friend.findOne({ userA, userB }),
                FriendRequest.findOne({
                    $or: [
                        { from, to },
                        { from: to, to: from },
                    ],
                }),
            ]);

            if (alreadyFriends) {
                res.status(400).json({ message: 'Hai người đã là bạn bè' });
                return;
            }

            if (existingRequest) {
                res.status(400).json({ message: 'Đã có lời mời kết bạn đang chờ' });
                return;
            }

            const request = await FriendRequest.create({ from, to, message });

            res.status(201).json({ success: true, request, message: 'Gửi lời mời kết bạn thành công' });
        } catch (error) {
            console.error('Lỗi khi gửi lời mời kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    acceptFriend: async (req: Request, res: Response) => {
        try {
            const { requestId } = req.params;
            const userId = req.user._id?.toString();

            const request = await FriendRequest.findById(requestId);
            if (!request) {
                res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
                return;
            }

            if (request?.to.toString() !== userId) {
                res.status(400).json({ message: 'Bạn không có quyền chấp nhận lời mời kết bạn này' });
                return;
            }

            const friend = await Friend.create({
                userA: request.from,
                userB: request.to,
            });

            await FriendRequest.findByIdAndDelete(requestId);

            const from = await User.findById(request.from).select('_id  displayName avatarUrl  ').lean();

            res.status(200).json({
                success: true,
                friend,
                from,
                message: 'Chấp nhận lời mời kết bạn thành công',
                newFriend: {
                    _id: from?._id,
                    displayName: from?.displayName,
                    avatarUrl: from?.avatarUrl,
                },
            });
        } catch (error) {
            console.error('Lỗi khi chấp nhận lời mời kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    rejectFriend: async (req: Request, res: Response) => {
        try {
            const { requestId } = req.params;
            const userId = req.user._id?.toString();
            const request = await FriendRequest.findById(requestId);

            if (!request) {
                res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
                return;
            }

            if (request?.to.toString() !== userId) {
                res.status(403).json({ message: 'Bạn không có quyền từ chối lời mời kết bạn này ' });
                return;
            }

            await FriendRequest.findByIdAndDelete(requestId);
            res.status(204).json({ success: true, message: 'Xoa lời mời kết bạn thành công' });
        } catch (error) {
            console.error('Lỗi khi từ chối lời mời kết bạn =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getAllFriends: async (req: Request, res: Response) => {
        try {
            const userId = req.user._id?.toString();
            const friendships = await Friend.find({ $or: [{ userA: userId }, { userB: userId }] })
                .populate('userA', '_id displayName username avatarUrl')
                .populate('userB', '_id displayName username avatarUrl')
                .lean();

            if (!friendships.length) {
                res.status(200).json({ friends: [] });
                return;
            }

            const friends = friendships.map((friendship) =>
                friendship.userA._id.toString() === userId ? friendship.userB : friendship.userA,
            );

            res.status(200).json({ success: true, friends, message: 'Lấy danh sách bạn bè thành công' });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bạn bè  =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    getFriendRequests: async (req: Request, res: Response) => {
        try {
            const userId = req.user._id?.toString();
            const [sent, received] = await Promise.all([
                FriendRequest.find({ from: userId }).populate('to', '_id username displayName avatarUrl'),
                FriendRequest.find({ to: userId }).populate('from', '_id username displayName avatarUrl'),
            ]);

            res.status(200).json({
                success: true,
                sent,
                received,
                message: 'Danh sách yêu cầu kết bạn đã gửi và đã nhận',
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách yêu cầu kết bạn  =>', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
};

export default friendController;
