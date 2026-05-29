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
    updateProfile: async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const { displayName, bio, phone, email } = req.body;

            if (!displayName || displayName.trim() === '') {
                res.status(400).json({ message: 'Tên hiển thị không được để trống' });
                return;
            }

            // Kiểm tra email trùng lặp nếu email thay đổi
            if (email && email !== req.user.email) {
                const existingEmail = await prisma.user.findUnique({ where: { email } });
                if (existingEmail) {
                    res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác' });
                    return;
                }
            }

            // Kiểm tra số điện thoại trùng lặp nếu có thay đổi
            if (phone && phone !== req.user.phone) {
                const existingPhone = await prisma.user.findUnique({ where: { phone } });
                if (existingPhone) {
                    res.status(400).json({ message: 'Số điện thoại đã được sử dụng bởi người dùng khác' });
                    return;
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    displayName,
                    bio: bio || null,
                    phone: phone || null,
                    email: email || req.user.email
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                    bio: true,
                    phone: true
                }
            });

            res.status(200).json({ success: true, user: updatedUser });
        } catch (error) {
            console.log('Lỗi tại userController, updateProfile: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật thông tin cá nhân' });
        }
    },
    changePassword: async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            const bcrypt = require('bcryptjs');

            if (!currentPassword || !newPassword) {
                res.status(400).json({ message: 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới' });
                return;
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                res.status(404).json({ message: 'Không tìm thấy người dùng' });
                return;
            }

            const isMatch = await bcrypt.compare(currentPassword, user.hashPassword);
            if (!isMatch) {
                res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
                return;
            }

            const hashPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { hashPassword }
            });

            res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
        } catch (error) {
            console.log('Lỗi tại userController, changePassword: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống khi đổi mật khẩu' });
        }
    },
};

export default userController;

