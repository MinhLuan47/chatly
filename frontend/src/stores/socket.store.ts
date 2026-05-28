import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';

import useAuthStore from './auth.store.ts';
import { useChatStore } from './chat.store.ts';
import type { IConversation } from '@/interfaces/chat.interface.ts';

const baseUrl = import.meta.env.VITE_SOCKET_URL;

const useSocketStore = create<{
    socket: Socket | null;
    onlineUsers: string[];
    connectSocket: () => void;
    disconnectSocket: () => void;
}>((set, get) => ({
    socket: null,
    onlineUsers: [],
    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;

        if (existingSocket) return;

        const socket: Socket = io(baseUrl, {
            auth: { token: accessToken },
            transports: ['websocket'],
        });
        set({ socket });
        socket.on('connect', () => {
            console.log('socket connected');
        });

        // listen for online users
        socket.on('onlineUsers', (userIds: string[]) => {
            set({ onlineUsers: userIds });
        });

        socket.on('newMessage', ({ message, conversation, unreadCounts }) => {
            console.log('newMessage', message, conversation, unreadCounts);
            useChatStore.getState().addMessage(message);
            const lastMessage = {
                _id: conversation.lastMessage._id,
                senderId: {
                    _id: conversation.lastMessage.senderId,
                    displayName: '',
                    avatarUrl: null,
                },
                content: conversation.lastMessage.content,
                createdAt: conversation.lastMessage.createdAt,
            };

            const updateConversation = {
                ...conversation,
                lastMessage,
                unreadCounts,
            };

            if (useChatStore.getState().activeConversationId === message.conversationId) {
                //todo
                useChatStore.getState().markAsSeen(updateConversation);
            }
            useChatStore.getState().updateConversation(updateConversation);
        });

        socket.on('readMessage', ({ conversation, lastMessage }) => {
            const updated = {
                _id: conversation._id,
                lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                unreadCounts: conversation.unreadCounts,
                seenBy: conversation.seenBy,
            };
            useChatStore.getState().updateConversation(updated);
        });

        socket.on('newGroup', (conversation: IConversation) => {
            useChatStore.getState().addConvo(conversation);
            socket.emit('joinConversation', conversation._id); // join conversation
        });
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },
}));

export default useSocketStore;
