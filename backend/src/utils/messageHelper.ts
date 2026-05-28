import prisma from '../libs/prisma.ts';

export const updateConversationAfterCreateMessage = async (conversationId: string, message: any, senderId: string) => {
    // 1. Update conversation lastMessage link and timestamp
    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            lastMessageId: message.id,
            lastMessageAt: message.createdAt
        }
    });

    // 2. Reset unreadCount for the sender, and set their lastSeenAt
    await prisma.participant.update({
        where: {
            conversationId_userId: {
                conversationId,
                userId: senderId
            }
        },
        data: {
            unreadCount: 0,
            lastSeenAt: message.createdAt
        }
    });

    // 3. Increment unreadCount for all other participants
    await prisma.participant.updateMany({
        where: {
            conversationId,
            NOT: {
                userId: senderId
            }
        },
        data: {
            unreadCount: {
                increment: 1
            }
        }
    });
};

export const emitNewMessage = async (io: any, conversationId: string, message: any, senderId: string) => {
    // Get updated unread counts to emit to the room
    const participants = await prisma.participant.findMany({
        where: { conversationId }
    });

    const unreadCounts: Record<string, number> = {};
    participants.forEach((p) => {
        unreadCounts[p.userId] = p.unreadCount;
    });

    io.to(conversationId).emit('newMessage', {
        message,
        conversation: {
            id: conversationId,
            lastMessage: {
                id: message.id,
                senderId: senderId,
                content: message.content,
                createdAt: message.createdAt,
            },
            lastMessageAt: message.createdAt,
        },
        unreadCounts,
    });
};
