import type { IConversation } from '@/interfaces/chat.interface';
import { useChatStore } from '@/stores/chat.store';
import { SidebarTrigger } from '../ui/sidebar';
import useAuthStore from '@/stores/auth.store';
import { Separator } from '@radix-ui/react-separator';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import GroupChatAvatar from './GroupChatAvatar';
import useSocketStore from '@/stores/socket.store';

const ChatWindowHeader = ({ chat }: { chat?: IConversation }) => {
    const { conversations, activeConversationId } = useChatStore();
    const { user } = useAuthStore();
    const { onlineUsers } = useSocketStore();

    chat = chat || conversations.find((c) => c._id === activeConversationId);
    let otherUser;
    if (!chat)
        return (
            <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 w-full px-4 py-2">
                <SidebarTrigger className="-ml-1 text-foreground" />
            </header>
        );

    if (chat.type === 'direct') {
        const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
        otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

        if (!otherUser || !user) return;
    }
    return (
        <header className="sticky top-0 z-10 flex items-center px-4 py-2 bg-background">
            <div className="flex items-center gap-2 w-full">
                <SidebarTrigger className="-ml-1 text-foreground" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <div className="flex items-center gap-3 w-full p-2">
                    {/* Avatar */}
                    <div className="relative">
                        {chat.type === 'direct' ? (
                            <>
                                <UserAvatar
                                    type="sidebar"
                                    name={otherUser?.displayName ?? 'Chatly'}
                                    avatarUrl={otherUser?.avatarUrl ?? undefined}
                                />
                                <StatusBadge
                                    status={onlineUsers.includes(otherUser?._id ?? '') ? 'online' : 'offline'}
                                />
                            </>
                        ) : (
                            <GroupChatAvatar type="sidebar" participants={chat.participants} />
                        )}
                    </div>

                    {/* Name */}
                    <h2 className="font-semibold text-foreground">
                        {chat.type === 'direct' ? otherUser?.displayName : chat.group?.name}
                    </h2>
                </div>
            </div>
        </header>
    );
};

export default ChatWindowHeader;
