import api from '@/lib/axios';
import type { IConversationResponse, IMessage } from '@/interfaces/chat.interface';

interface IMessageResponse {
    messages: IMessage[];
    cursor?: string;
}

const pageSize = 15;

export const chatService = {
    fetchConversations: async (): Promise<IConversationResponse> => {
        const response = await api.get('/conversations');
        return response.data;
    },

    fetchMessages: async (conversationId: string, cursor?: string): Promise<IMessageResponse> => {
        const response = await api.get(`/conversations/${conversationId}/messages?limit=${pageSize}&cursor=${cursor}`);
        return {
            messages: response.data.messages,
            cursor: response.data.nextCursor,
        };
    },
    sendDirectMessage: async (recipientId: string, content: string = '', imgUrl?: string, conversationId?: string) => {
        const res = await api.post('/messages/direct', {
            recipientId,
            content,
            imgUrl,
            conversationId,
        });
        return res.data.message;
    },

    sendGroupMessage: async (conversationId: string, content: string = '', imgUrl?: string) => {
        const res = await api.post('/messages/group', { conversationId, content, imgUrl });
        return res.data.message;
    },
    markAsSeen: async (conversationId: string) => {
        const res = await api.patch(`/conversations/${conversationId}/seen`);
        return res.data;
    },
    createConversation: async (type: 'direct' | 'group', name: string, memberIds: string[]) => {
        const res = await api.post('/conversations', { type, name, memberIds });
        return res.data.conversation;
    },
};
