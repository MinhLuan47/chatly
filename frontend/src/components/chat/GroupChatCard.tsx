import type { IConversation } from '@/interfaces/chat.interface';
import { useChatStore } from '@/stores/chat.store';
import React from 'react';
import ChatCard from './ChatCard';
import useAuthStore from '@/stores/auth.store';
import GroupChatAvatar from './GroupChatAvatar';
import UnreadCountBadge from './UnreadCountBadge';

const GroupChatCard: React.FC<{ conver: IConversation }> = ({ conver }) => {
    const { user } = useAuthStore();
    const { activeConversationId, setActiveConversation, messages, fetchMessages } = useChatStore();

    if (!user) return null;

    const otherUser = conver.participants.find((p) => p._id !== user._id);
    if (!otherUser) return null;

    const name = conver.group.name ?? '';
    const unreadCount = conver.unreadCounts[user._id || ''];

    const handleSelectConversation = async (converId: string) => {
        setActiveConversation(converId);
        if (!messages[converId]) {
            await fetchMessages(converId);
        }
    };

    return (
        <ChatCard
            converId={conver._id}
            name={name}
            timestamp={conver.lastMessage?.createdAt ? new Date(conver.lastMessage.createdAt) : undefined}
            isActive={activeConversationId === conver._id}
            onSelect={handleSelectConversation}
            unreadCount={unreadCount}
            leftSection={
                <>
                    <GroupChatAvatar type={'chat'} participants={conver.participants} />
                    {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
                </>
            }
            subTitle={<p className="text-sm text-muted-foreground truncate">{conver.participants.length} thành viên</p>}
        />
    );
};

export default GroupChatCard;
