import type { IConversation, IMessage } from '@/interfaces/chat.interface';
import { chatService } from '@/services/chat.service';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAuthStore from './auth.store';
import useSocketStore from './socket.store';

interface ChatState {
    conversations: IConversation[];
    messages: Record<
        string,
        {
            items: IMessage[];
            hasMore: boolean;
            nextCuror?: string | null;
        }
    >;
    activeConversationId: string | null;
    converLoading: boolean;
    messageLoading: boolean;
    loading: boolean;
    reset: () => void;
    setActiveConversation: (conversationId: string | null) => void;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId?: string) => Promise<void>;
    sendDirectMessage: (recipientId: string, content: string, imgUrl?: string) => Promise<void>;
    sendGroupMessage: (conversationId: string, content: string, imgUrl?: string) => Promise<void>;
    addMessage: (message: IMessage) => Promise<void>;
    updateConversation: (conversation: any) => Promise<void>;
    markAsSeen: (conversationId: string) => Promise<void>;
    addConvo: (covo: IConversation) => void;
    createConversation: (type: 'direct' | 'group', name: string, memberIds: string[]) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            converLoading: false,
            messageLoading: false,
            loading: false,
            reset: () =>
                set({
                    conversations: [],
                    messages: {},
                    activeConversationId: null,
                    converLoading: false,
                }),
            setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
            fetchConversations: async () => {
                try {
                    set({ converLoading: true });
                    const { conversations } = await chatService.fetchConversations();
                    set({ conversations, converLoading: false });
                } catch (error) {
                    console.log('Lỗi tại chatStore, fetchConversations: ', error);
                    set({ converLoading: false });
                }
            },
            fetchMessages: async (conversationId) => {
                try {
                    const { activeConversationId, messages } = get();
                    const { user } = useAuthStore.getState();

                    const converId = conversationId ?? activeConversationId;
                    if (!converId) return;

                    const current = messages?.[converId];
                    const nextCursor = current?.nextCuror === undefined ? '' : current?.nextCuror;

                    if (nextCursor === null) return;

                    set({ messageLoading: true });

                    const { messages: newMessages, cursor } = await chatService.fetchMessages(converId, nextCursor);

                    const processed = newMessages.map((m) => ({
                        ...m,
                        isOwn: m.senderId === user?.id,
                    }));

                    set((state) => {
                        const prev = state.messages[converId]?.items ?? [];
                        const newItems = prev.length > 0 ? [...prev, ...processed] : processed;

                        return {
                            messages: {
                                ...state.messages,
                                [converId]: {
                                    items: newItems,
                                    hasMore: !!cursor,
                                    nextCuror: cursor ?? null,
                                },
                            },
                            messageLoading: false,
                        };
                    });
                } catch (error) {
                    console.log('Lỗi tại chatStore, fetchMessages: ', error);
                } finally {
                    set({ messageLoading: false });
                }
            },
            sendDirectMessage: async (recipientId, content, imgUrl) => {
                try {
                    const { activeConversationId } = get();
                    await chatService.sendDirectMessage(
                        recipientId,
                        content,
                        imgUrl,
                        activeConversationId || undefined,
                    );

                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c.id === activeConversationId ? { ...c, seenBy: [] } : c,
                        ),
                    }));
                } catch (error) {
                    console.log('Lỗi tại chatStore, sendDirectMessage: ', error);
                }
            },
            sendGroupMessage: async (conversationId, content, imgUrl) => {
                try {
                    await chatService.sendGroupMessage(conversationId, content, imgUrl ?? '');
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c.id === get().activeConversationId ? { ...c, seenBy: [] } : c,
                        ),
                    }));
                } catch (error) {
                    console.log('Lỗi tại chatStore, sendGroupMessage: ', error);
                }
            },
            addMessage: async (message) => {
                try {
                    const { user } = useAuthStore.getState();
                    const { fetchMessages } = get();

                    message.isOwn = message.senderId === user?.id;
                    const converId = message.conversationId;

                    let prevItems = get().messages[converId]?.items ?? [];

                    if (prevItems.length === 0) {
                        await fetchMessages(message.conversationId);

                        prevItems = get().messages[converId]?.items ?? [];
                    }
                    set((state) => {
                        if (!prevItems.some((m) => m.id === message.id)) {
                            return state;
                        }

                        return {
                            messages: {
                                ...state.messages,
                                [converId]: {
                                    items: [...prevItems, message],
                                    hasMore: state.messages[converId].hasMore,
                                    nextCuror: state.messages[converId].nextCuror ?? undefined,
                                },
                            },
                        };
                    });
                    await fetchMessages(converId);
                } catch (error) {
                    console.log('Lỗi tại chatStore, addMessage: ', error);
                }
            },
            updateConversation: async (conversation: any) => {
                set((state) => {
                    const exists = state.conversations.some((c: any) => c.id === conversation.id);
                    if (!exists) {
                        return {
                            conversations: [conversation, ...state.conversations]
                        };
                    }
                    return {
                        conversations: state.conversations.map((c: any) => (c.id === conversation.id ? conversation : c)),
                    };
                });
            },
            markAsSeen: async (conversationId) => {
                try {
                    const { user } = useAuthStore.getState();
                    const { activeConversationId, conversations } = get();

                    if (!conversations || !user) return;

                    const conver = conversations.find((c) => c.id === conversationId);

                    if (!conver) return;

                    if ((conver.unreadCounts?.[user.id] ?? 0) === 0) return;

                    await chatService.markAsSeen(activeConversationId || conversationId);

                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c.id === conversationId && c.lastMessage
                                ? {
                                      ...c,
                                      unreadCounts: {
                                          ...c.unreadCounts,
                                          [user.id]: 0,
                                      },
                                  }
                                : c,
                        ),
                    }));
                } catch (error) {
                    console.log('Lỗi tại chatStore, markAsSeen: ', error);
                }
            },
            addConvo: (covo) => {
                set((state) => {
                    const exists = state.conversations.some((c) => c.id.toString() === covo.id.toString());
                    return {
                        conversations: exists ? state.conversations : [covo, ...state.conversations],
                        activeConversationId: covo.id,
                    };
                });
            },
            createConversation: async (type, name, memberIds) => {
                try {
                    set({ loading: true });
                    const conversation = await chatService.createConversation(type, name, memberIds);
                    get().addConvo(conversation);

                    useSocketStore.getState().socket?.emit('joinConversation', conversation.id);
                } catch (error) {
                    console.log('Lỗi xảy ra khi gọi  createConversation: ', error);
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'chat-storage',
            partialize: (state) => ({ conversations: state.conversations }),
        },
    ),
);
