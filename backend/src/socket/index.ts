import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middlewares/socket.middleware.ts';
import conversationController from '../controllers/conversation.controller.ts';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'process.env.CLIENT_URL',
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); //{userId: socketId}

io.on('connection', async (socket: any) => {
    const user = socket.user;
    console.log('a user connected:', socket.id);
    console.log(user.displayName, 'connected với socket id:', socket.id);

    onlineUsers.set(user.id, socket.id);

    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    const conversationIds = await conversationController.getUserConversationIds(user.id);
    conversationIds.forEach((conversationId) => socket.join(conversationId));

    socket.on('joinConversation', (conversationId: any) => {
        socket.join(conversationId);
    });

    socket.join(user.id.toString());

    socket.on('disconnect', () => {
        onlineUsers.delete(user.id);
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        console.log('a user disconnected:', socket.id);
    });
});

export { app, io, server };
