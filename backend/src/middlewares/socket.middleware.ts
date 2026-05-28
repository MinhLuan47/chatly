import jwt from 'jsonwebtoken';
import User from '../models/user.model.ts';

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
        const user = await User.findById(decoded.userId).select('-_hashPassword');
        socket.user = user;
        next();
    } catch (error) {
        console.log('Lỗi tại authMiddleware, protectRoute: ', error);
        next(new Error('Unauthorized'));
    }
};
