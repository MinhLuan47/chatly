import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { IUserCreate } from '../interfaces/user.interface.ts';
import prisma from '../libs/prisma.ts';

const ACCESS_TOKEN_TTL = 1000 * 60 * 15; // 15m
const REFRESH_TOKEN_TTL = 1000 * 60 * 60 * 24 * 14; // 14d

const authController = {
    signup: async (req: Request, res: Response) => {
        try {
            const data: IUserCreate = req.body;
            if (!data.username || !data.email || !data.password || !data.firstName || !data.lastName) {
                res.status(400).send({ message: 'username, email, password, firstName, lastName are required' });
                return;
            }

            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: data.username },
                        { email: data.email }
                    ]
                }
            });
            if (existingUser) {
                res.status(409).json({ message: 'User already exists' });
                return;
            }

            const hashPassword = await bcrypt.hash(data.password, 10);
            await prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email,
                    hashPassword,
                    displayName: `${data.lastName} ${data.firstName}`,
                },
            });
            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
            });
        } catch (error) {
            console.log('Lỗi tại authController, signup: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    signin: async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { username }
            });
            if (!user) {
                res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.hashPassword);
            if (!isMatch) {
                res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
                return;
            }

            //tạo token
            const accessToken = jwt.sign(
                {
                    userId: user.id,
                },
                process.env.ACCESS_TOKEN_SECRET as string,
                {
                    expiresIn: ACCESS_TOKEN_TTL,
                },
            );

            const refreshToken = crypto.randomBytes(64).toString('hex');
            await prisma.session.create({
                data: {
                    userId: user.id,
                    refreshToken,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
                }
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: REFRESH_TOKEN_TTL,
            });

            res.status(200).json({ message: 'Đăng nhập thành công', accessToken });
        } catch (error) {
            console.log('Lỗi tại authController, signin: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    signout: async (req: Request, res: Response) => {
        try {
            const token = req.cookies?.refreshToken;
            if (!token) {
                res.status(400).json({ message: 'Chưa đăng nhập' });
                return;
            }

            // Xóa session trong database
            await prisma.session.deleteMany({
                where: { refreshToken: token }
            });

            res.clearCookie('refreshToken');
            res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
        } catch (error) {
            console.log('Lỗi tại authController, signout: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
    refreshToken: async (req: Request, res: Response) => {
        try {
            const token = req.cookies?.refreshToken;
            if (!token) {
                res.status(400).json({ success: false, message: 'Chưa đăng nhập' });
                return;
            }

            const session = await prisma.session.findUnique({
                where: { refreshToken: token }
            });
            if (!session) {
                res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
                return;
            }
            if (session.expiresAt < new Date()) {
                res.status(403).json({ success: false, message: 'Token đã hết hạn' });
                return;
            }

            const accessToken = jwt.sign(
                {
                    userId: session.userId,
                },
                process.env.ACCESS_TOKEN_SECRET as string,
                {
                    expiresIn: ACCESS_TOKEN_TTL,
                },
            );

            res.status(200).json({ success: true, accessToken });
        } catch (error) {
            console.log('Lỗi tại authController, refeshToken: ', error);
            res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    },
};

export default authController;

