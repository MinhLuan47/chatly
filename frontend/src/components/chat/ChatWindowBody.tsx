import { useChatStore } from '@/stores/chat.store';
import ChatWelcomeScreen from './ChatWelcomeScreen';
import MessageItem from './MessageItem';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

const ChatWindowBody = () => {
    const { activeConversationId, conversations, messages: allMessages, fetchMessages } = useChatStore();
    const [lastMessageStatus, setLastMessageStatus] = useState<'delivered' | 'seen'>('delivered');

    const messages = allMessages[activeConversationId!]?.items ?? [];

    const reverseMessages = [...messages].reverse();
    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    const selectedConversation = conversations.find((conver) => conver._id === activeConversationId);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const key = `chat-scroll-${activeConversationId}`;

    const handleScrollSave = () => {
        const container = containerRef.current;
        if (!container || !activeConversationId) return;

        sessionStorage.setItem(
            key,
            JSON.stringify({
                scrollTop: container.scrollTop, //vị trí top hiện tại
                scrollHeight: container.scrollHeight, // tổng chiều cao có thể cuộn được
            }),
        );
    };
    const fetchMoreMessages = async () => {
        if (!activeConversationId) return;

        try {
            await fetchMessages(activeConversationId);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const lastMessage = selectedConversation?.lastMessage;
        if (!lastMessage) return;

        const seenBy = selectedConversation?.seenBy ?? [];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastMessageStatus(seenBy.length > 0 ? 'seen' : 'delivered');
    }, [selectedConversation]);

    // kéo xuống dưới khi load convo
    useLayoutEffect(() => {
        if (!messagesEndRef.current) return;

        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [activeConversationId]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container || !activeConversationId) return;

        const item = sessionStorage.getItem(key);
        if (item) {
            const { scrollTop } = JSON.parse(item);
            requestAnimationFrame(() => {
                container.scrollTop = scrollTop;
            });
        }
    }, [messages.length]);

    if (!selectedConversation) return <ChatWelcomeScreen />;

    if (messages.length === 0)
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Chưa có tin nhắn nào trong cuộc trò chuyện nào
            </div>
        );

    return (
        <div className=" flex flex-col h-full p-4 bg-primary overflow-hidden ">
            <div
                id="scrollableDiv"
                ref={containerRef}
                onScroll={handleScrollSave}
                className="flex flex-col overflow-y-auto overflow-x-hidden beautifull-scrollbar"
            >
                <div ref={messagesEndRef}></div>
                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    scrollableTarget="scrollableDiv"
                    loader={<p>Đang tải</p>}
                    inverse={true}
                    style={{
                        display: 'flex',
                        flexDirection: 'column-reverse',
                    }}
                >
                    {reverseMessages.map((m, index) => (
                        <MessageItem
                            key={m._id ?? index}
                            message={m}
                            index={index}
                            messages={reverseMessages}
                            selectedConver={selectedConversation}
                            lastMessageStatus={lastMessageStatus}
                        />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default ChatWindowBody;
