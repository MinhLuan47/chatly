import { Request, Response } from 'express';
import { uploadImageFromBuffer } from '../middlewares/upload.middleware';
import prisma from '../libs/prisma.ts';

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

            const user = await prisma.user.findUnique({
                where: { username: username.toString() },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                }
            });
            res.status(200).json({ success: true, user });
        } catch (error) {
            console.log('Lỗi tại userController, searchUserByUserName: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    uploadAvatar: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const userId = req.user.id;

            if (!file) {
                res.status(400).json({ message: 'file is required' });
                return;
            }

            const result = (await uploadImageFromBuffer(file.buffer, {})) as { secure_url: string; public_id: string };

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { avatarUrl: result.secure_url, avatarId: result.public_id },
                select: { avatarUrl: true }
            });

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

