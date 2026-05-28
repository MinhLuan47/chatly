import type { Friend } from '@/interfaces/user.interface';
import { X } from 'lucide-react';
import UserAvatar from '../chat/UserAvatar';

interface Props {
    invitedUsers: Friend[];
    onRemove: (user: Friend) => void;
}

const SelectedUsersList = ({ invitedUsers, onRemove }: Props) => {
    if (invitedUsers.length > 0) {
        return;
    }

    return (
        <div className="flex flex-wrap gap-2 pt-2 ">
            {invitedUsers.map((user) => (
                <div
                    key={user.id}
                    className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full  "
                    onClick={() => onRemove(user)}
                >
                    <UserAvatar type="chat" name={user.displayName} avatarUrl={user.avatarUrl} />
                    <span className="font-medium">{user.displayName}</span>
                    <X className="size-3 cursor-pointer hover:text-destructive" onClick={() => onRemove(user)} />
                </div>
            ))}
        </div>
    );
};

export default SelectedUsersList;
