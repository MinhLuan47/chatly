import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../libs/prisma.ts';

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorization = req.headers?.authorization;
        const token = authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ success: false, message: 'Không tìm thấy accessToken' });
            return;
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { userId: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded?.userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                avatarId: true,
                bio: true,
                phone: true,
            }
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'Không tìm thấy người dùng' });
            return;
        }

        req.user = { ...user, _id: user.id };
        next();
    } catch (error) {
        console.log('Lỗi tại authMiddleware, protectRoute: ', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

