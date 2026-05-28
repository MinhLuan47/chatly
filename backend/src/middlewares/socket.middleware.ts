import jwt from 'jsonwebtoken';
import prisma from '../libs/prisma.ts';

export const socketAuthMiddleware = async (socket: any, next: any) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { userId: string };
        if (!decoded) {
            return next(new Error('Authentication error'));
        }
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                avatarId: true,
                bio: true,
                phone: true
            }
        });
        if (!user) {
            return next(new Error('Authentication error'));
        }
        socket.user = { ...user, _id: user.id };
        next();
    } catch (error) {
        console.log('Lỗi tại authMiddleware, protectRoute: ', error);
        next(new Error('Unauthorized'));
    }
};

