import type { IParticipant } from '@/interfaces/chat.interface';
import { Ellipsis } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface GroupChatAvatarProps {
    participants: IParticipant[];
    type: 'sidebar' | 'chat';
}
const GroupChatAvatar = ({ participants = [], type }: GroupChatAvatarProps) => {
    const avatars = [];
    const limit = Math.min(participants?.length || 0, 4);

    for (let i = 0; i < limit; i++) {
        const member = participants[i];
        if (!member) continue;
        avatars.push(
            <UserAvatar
                key={member.id}
                type={type}
                name={member.displayName}
                avatarUrl={member.avatarUrl ?? undefined}
            />,
        );
    }
    return (
        <div className="relative flex -space-x-2 *:data[slot=avatar]:ring-background *:data[slot=avatar]:ring-2">
            {avatars}
            {participants && participants.length > limit && (
                <div className="flex items-center z-10 justify-center size-8 rounded-full bg-muted ring-2 ring-background text-muted-foreground">
                    <Ellipsis className="size-4" />
                </div>
            )}
        </div>
    );
};

export default GroupChatAvatar;
