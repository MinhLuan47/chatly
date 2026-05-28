import { useChatStore } from '@/stores/chat.store';
import DirectMessageCard from './DirectMessageCard';
import { Fragment } from 'react/jsx-runtime';

const DirectMessageList = () => {
    const { conversations } = useChatStore();
    if (!conversations) return;

    const directConversations = conversations.filter((conver) => conver.type === 'direct');

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {directConversations.map((conver) => (
                <Fragment key={conver._id}>
                    <DirectMessageCard conver={conver} />
                </Fragment>
            ))}
        </div>
    );
};

export default DirectMessageList;
