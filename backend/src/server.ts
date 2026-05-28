import { protectRoute } from './middlewares/auth.middleware';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import cookieParser from 'cookie-parser';
import connectDB from './libs/db.ts';
import authRoute from './routes/auth.route.ts';
import userRoute from './routes/user.route.ts';
import friendRoute from './routes/friend.route.ts';
import messageRoute from './routes/message.route.ts';
import conversationRoute from './routes/conversation.route.ts';

import { app, server } from './socket/index.ts';
dotenv.config();

const PORT = process.env.PORT || 5001;
app.use(cors({ credentials: true, origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use('/api/v1/auth', authRoute);

app.use('/api/v1', protectRoute);

app.use('/api/v1/user', userRoute);
app.use('/api/v1/friends', friendRoute);
app.use('/api/v1/messages', messageRoute);
app.use('/api/v1/conversations', conversationRoute);

connectDB();
server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
