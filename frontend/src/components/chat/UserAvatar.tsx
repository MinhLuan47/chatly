import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface UserAvatarProps {
    type: 'sidebar' | 'profile' | 'chat';
    name: string;
    avatarUrl?: string;
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ type, name, avatarUrl, className }) => {
    const bgColor = !avatarUrl ? 'bg-blue-500' : '';

    if (!name) name = 'Chatly';

    return (
        <Avatar
            className={cn(
                className ?? '',
                type === 'chat' && 'size-8 text-sm',
                type === 'sidebar' && 'size-12 text-base',
                type === 'profile' && 'size-24 text-3xl shadow-md',
            )}
        >
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className={cn(bgColor, 'text-white font-semibold uppercase')}>
                {name.charAt(0)}
            </AvatarFallback>
        </Avatar>
    );
};

export default UserAvatar;
