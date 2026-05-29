import type { IConversation, IMessage } from '@/interfaces/chat.interface';
import { cn, formatMessageTime } from '@/lib/utils';
import React from 'react';
import UserAvatar from './UserAvatar';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageOff } from 'lucide-react';

interface MessageItemProps {
    message: IMessage;
    index: number;
    messages: IMessage[];
    selectedConver: IConversation;
    lastMessageStatus: 'seen' | 'delivered';
}
const MessageItem: React.FC<MessageItemProps> = ({ message, index, messages, selectedConver, lastMessageStatus }) => {
    const [imageError, setImageError] = React.useState(false);
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const isGroupBreak =
        index === 0 ||
        (prev && prev.senderId !== message.senderId) ||
        new Date(message.createdAt).getTime() - new Date(prev?.createdAt || 0).getTime() > 5 * 60 * 1000; // 5 minutes

    const participant = selectedConver?.participants.find((p) => p.id.toString() === message.senderId.toString());
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
                <Card className={cn('p-3', message.isOwn ? 'bg-chat-bubble-sent border-0' : 'bg-chat-bubble-received')} data-testid="message-card">
                    {message.imageUrl && (
                        <div className="mb-2 max-w-72 min-w-[200px] min-h-[150px] flex items-center justify-center bg-slate-950/20 overflow-hidden rounded-md border border-border/20">
                            {imageError ? (
                                <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground text-xs text-center" data-testid="image-error-placeholder">
                                    <ImageOff className="size-8 opacity-60" />
                                    <span>Không thể tải ảnh</span>
                                </div>
                            ) : (
                                <img
                                    src={message.imageUrl}
                                    alt="Sent image"
                                    className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-smooth"
                                    data-testid="chat-message-image"
                                    onError={() => setImageError(true)}
                                />
                            )}
                        </div>
                    )}
                    {message.content && (
                        <p className="text-sm leading-relaxed wrap-break-word" data-testid="message-text">
                            {message.content}
                        </p>
                    )}
                </Card>

                {/* timestamp */}
                {isGroupBreak && (
                    <span className="px-1 text-xs text-muted-foreground">
                        {formatMessageTime(new Date(message.createdAt))}
                    </span>
                )}
                {message.isOwn && message.id === selectedConver?.lastMessage?.id && (
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
