import type { IConversation } from '@/interfaces/chat.interface';
import useAuthStore from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import React from 'react';
import ChatCard from './ChatCard';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import UnreadCountBadge from './UnreadCountBadge';
import useSocketStore from '@/stores/socket.store';

interface DirectMessageCardProps {
    conver: IConversation;
}
const DirectMessageCard: React.FC<DirectMessageCardProps> = ({ conver }) => {
    const { user } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const { activeConversationId, setActiveConversation, messages, fetchMessages } = useChatStore();

    if (!user) return null;
    const otherUser = conver.participants.find((p) => p.id !== user.id);
    if (!otherUser) return null;

    const unreadCount = conver.unreadCounts[user.id || ''];
    const lastMessage = conver.lastMessage?.content ?? '';

    const handleSelectConversation = async (converId: string) => {
        setActiveConversation(converId);
        if (!messages[converId]) {
            await fetchMessages(converId);
        }
    };
    return (
        <ChatCard
            converId={conver.id}
            name={otherUser.displayName ?? ''}
            timestamp={conver.lastMessage?.createdAt ? new Date(conver.lastMessage.createdAt) : undefined}
            isActive={activeConversationId === conver.id}
            onSelect={handleSelectConversation}
            unreadCount={unreadCount}
            leftSection={
                <>
                    <UserAvatar
                        type="sidebar"
                        name={otherUser.displayName ?? ''}
                        avatarUrl={otherUser.avatarUrl ?? undefined}
                    />
                    <StatusBadge status={onlineUsers.includes(otherUser.id) ? 'online' : 'offline'} />
                    {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
                </>
            }
            subTitle={
                <p
                    className={cn(
                        'text-sm truncate',
                        unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
                    )}
                >
                    {lastMessage}
                </p>
            }
        />
    );
};

export default DirectMessageCard;
