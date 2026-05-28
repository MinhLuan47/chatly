import { Request, Response } from 'express';
import { uploadImageFromBuffer } from '../middlewares/upload.middleware';
import User from '../models/user.model';

const userController = {
    authMe: async (req: Request, res: Response) => {
        try {
            const user = req.user;
            res.status(200).json({ success: true, user });
        } catch (error) {
            console.log('Lỗi tại userController, authMe: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    searchUserByUserName: async (req: Request, res: Response) => {
        try {
            const { username } = req.query;

            if (!username || username.toString().trim() === '') {
                res.status(400).json({ message: 'username is required' });
                return;
            }

            const user = await User.findOne({ username }).select('_id username displayName avatarUrl').lean();
            res.status(200).json({ success: true, user });
        } catch (error) {
            console.log('Lỗi tại userController, searchUserByUserName: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    uploadAvatar: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const userId = req.user._id;

            if (!file) {
                res.status(400).json({ message: 'file is required' });
                return;
            }

            const result = (await uploadImageFromBuffer(file.buffer, {})) as { secure_url: string; public_id: string };

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { avatarUrl: result.secure_url, avatarId: result.public_id },
                { new: true },
            ).select(' avatarUrl');

            if (!updatedUser || !updatedUser.avatarUrl) {
                res.status(400).json({ message: 'Avatar trả về null' });
                return;
            }

            res.status(200).json({ success: true, avatarUrl: updatedUser.avatarUrl });
        } catch (error) {
            console.log('Lỗi tại userController, uploadAvatar: ', error);
            res.status(500).json({ message: 'Avatar upload fail' });
        }
    },
};

export default userController;
