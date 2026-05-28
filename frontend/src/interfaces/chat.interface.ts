export interface IParticipant {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
    joinedAt: string;
}

export interface ISeenUser {
    _id: string;
    displayName?: string;
    avatarUrl?: string | null;
}

export interface IGroup {
    name: string;
    createdBy: string;
}

export interface ILastMessage {
    _id: string;
    content: string;
    createdAt: string;
    sender: {
        _id: string;
        displayName: string;
        avatarUrl?: string | null;
    };
}

export interface IConversation {
    _id: string;
    type: 'direct' | 'group';
    group: IGroup;
    participants: IParticipant[];
    lastMessageAt: string;
    seenBy: ISeenUser[];
    lastMessage: ILastMessage | null;
    unreadCounts: Record<string, number>; // key = userId, value = unread count
    createdAt: string;
    updatedAt: string;
}

export interface IConversationResponse {
    conversations: IConversation[];
}

export interface IMessage {
    _id: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    imgUrl?: string | null;
    updatedAt?: string | null;
    createdAt: string;
    isOwn?: boolean;
}
