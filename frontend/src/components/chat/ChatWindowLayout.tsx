import { useChatStore } from '@/stores/chat.store';
import { useEffect } from 'react';
import { SidebarInset } from '../ui/sidebar';
import ChatWelcomeScreen from './ChatWelcomeScreen';
import ChatWindowBody from './ChatWindowBody';
import ChatWindowHeader from './ChatWindowHeader';
import ChatWindowSkeleton from './ChatWindowSkeleton';
import MessageInput from './MessageInput';

const ChatWindowLayout = () => {
    const { activeConversationId, messageLoading, conversations, markAsSeen } = useChatStore();
    const selectedConversation = conversations?.find((conver) => conver.id === activeConversationId) ?? null;

    useEffect(() => {
        if (!selectedConversation) return;

        const markSeen = async () => {
            try {
                await markAsSeen(selectedConversation.id);
            } catch (error) {
                console.log('Lỗi tại chatStore, markAsSeen: ', error);
            }
        };

        markSeen();
    }, [selectedConversation, markAsSeen]);

    if (!selectedConversation) return <ChatWelcomeScreen />;

    if (messageLoading) return <ChatWindowSkeleton />;

    return (
        <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md">
            {/* Header */}
            <ChatWindowHeader chat={selectedConversation} />

            {/* Body */}
            <div className="flex-1 overflow-y-auto  ">
                <ChatWindowBody />
            </div>

            {/* Footer */}
            <MessageInput selectedConver={selectedConversation} />
        </SidebarInset>
    );
};

export default ChatWindowLayout;
