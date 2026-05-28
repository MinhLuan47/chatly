import React from 'react';
import { Card } from '@/components/ui/card';
import { formatMessageTime, cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';

interface ChatCardProps {
    converId: string;
    name: string;
    timestamp?: Date;
    isActive: boolean;
    onSelect: (id: string) => void;
    unreadCount?: number;
    leftSection?: React.ReactNode; //avatar
    subTitle?: React.ReactNode; //preview tin nhắn cuối , hoặc tv nhóm
}

const ChatCard: React.FC<ChatCardProps> = ({
    converId,
    name,
    timestamp,
    isActive,
    onSelect,
    unreadCount,
    leftSection,
    subTitle,
}) => {
    return (
        <Card
            key={converId}
            className={cn(
                'flex cursor-pointer items-center gap-3 border-none p-3 transition-all glass hover:bg-muted/30',
                isActive && 'ring-2 ring-primary/50 bg-linear-to-tr from-primary-glow/10 to-primary-foreground',
            )}
            onClick={() => onSelect(converId)}
        >
            <div className="flex items-center gap-3">
                <div className="relative">{leftSection}</div>
                <div className="flex-1 min-w-0 ">
                    <div className="flex items-center justify-between mb-1">
                        <h3
                            className={cn(
                                ' text-sm font-semibold leading-none truncate',
                                unreadCount && unreadCount > 0 && 'text-foreground',
                            )}
                        >
                            {name}
                        </h3>
                        <span
                            className={cn(
                                'text-xs text-muted-foreground',
                                unreadCount && unreadCount > 0 && 'text-foreground',
                            )}
                        >
                            {' '}
                            {timestamp && formatMessageTime(timestamp)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between ">
                        <div className={cn('flex items-center gap-1 flex-1 min-w-0', '')}>{subTitle}</div>
                        <MoreHorizontal className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:size-5 transition-all" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ChatCard;
