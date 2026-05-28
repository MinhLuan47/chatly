import { useChatStore } from '@/stores/chat.store';
import { Fragment } from 'react/jsx-runtime';
import GroupChatCard from './GroupChatCard';

const GroupChatList = () => {
    const { conversations } = useChatStore();
    if (!conversations) return;

    const directConversations = conversations.filter((conver) => conver.type === 'group');

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {directConversations.map((conver) => (
                <Fragment key={conver.id}>
                    <GroupChatCard conver={conver} />
                </Fragment>
            ))}
        </div>
    );
};

export default GroupChatList;
