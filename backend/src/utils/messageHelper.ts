export const updateConversationAfterCreateMessage = (conversation: any, message: any, senderId: any) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            senderId: senderId,
            content: message.content,
            createdAt: message.createdAt,
        },
    });
    conversation.participants.forEach((participant: any) => {
        const memberId = participant.userId.toString();
        const isSender = memberId === senderId;
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    });
};

export const emitNewMessage = (io: any, conversation: any, message: any) => {
    io.to(conversation._id).emit('newMessage', {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    });
};
