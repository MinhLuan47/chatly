import type { IConversation, IMessage } from '@/interfaces/chat.interface';
import { cn, formatMessageTime } from '@/lib/utils';
import React from 'react';
import UserAvatar from './UserAvatar';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface MessageItemProps {
    message: IMessage;
    index: number;
    messages: IMessage[];
    selectedConver: IConversation;
    lastMessageStatus: 'seen' | 'delivered';
}
const MessageItem: React.FC<MessageItemProps> = ({ message, index, messages, selectedConver, lastMessageStatus }) => {
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const isGroupBreak =
        index === 0 ||
        (prev && prev.senderId !== message.senderId) ||
        new Date(message.createdAt).getTime() - new Date(prev?.createdAt || 0).getTime() > 5 * 60 * 1000; // 5 minutes

    const participant = selectedConver?.participants.find((p) => p._id.toString() === message.senderId.toString());
    return (
        <div className={cn('flex gap-2 mt-1 message-bounce', message.isOwn ? 'justify-end' : 'justify-start')}>
            {/* Avatar */}
            {message.isOwn && (
                <div className="w-8">
                    {isGroupBreak && (
                        <UserAvatar
                            type="chat"
                            name={participant?.displayName ?? 'Chatly'}
                            avatarUrl={participant?.avatarUrl ?? undefined}
                        />
                    )}
                </div>
            )}

            <div
                className={cn(
                    'max-w-xs lg:max-w-md space-x-1 flex flex-col',
                    message.isOwn ? 'items-end' : 'items-start',
                )}
            >
                <Card className={cn('p-3', message.isOwn ? 'bg-chat-bubble-sent border-0' : 'bg-chat-bubble-received')}>
                    <p className="text-sm leading-relaxed wrap-break-word">{message.content}</p>
                </Card>

                {/* timestamp */}
                {isGroupBreak && (
                    <span className="px-1 text-xs text-muted-foreground">
                        {formatMessageTime(new Date(message.createdAt))}
                    </span>
                )}
                {message.isOwn && message._id === selectedConver?.lastMessage?._id && (
                    <Badge
                        variant="outline"
                        className={cn(
                            'h-4 px-1 py-0.5 text-xs border-0',
                            lastMessageStatus === 'seen'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {lastMessageStatus}
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default MessageItem;
