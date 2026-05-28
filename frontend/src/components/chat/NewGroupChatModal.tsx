import type { Friend } from '@/interfaces/user.interface';
import { useFriendStore } from '@/stores/friend.store';
import { UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import InviteSuggestionList from '../newGroupChat/InviteSuggestionList';
import SelectedUsersList from '../newGroupChat/SelectedUsersList';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import toast from 'react-hot-toast';
import { useChatStore } from '@/stores/chat.store';

const NewGroupChatModal = () => {
    const [groupName, setGroupName] = useState('');
    const [search, setSearch] = useState('');
    const { loading, createConversation } = useChatStore();
    const { friends, getFriends } = useFriendStore();
    const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
    const handleGetFriends = async () => {
        await getFriends();
    };

    const filterFriends = friends.filter(
        (friend) =>
            friend.displayName.toLowerCase().includes(search.toLowerCase()) &&
            !invitedUsers.some((u) => u.id === friend.id),
    );

    const handleSubmit = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            if (invitedUsers.length === 0) {
                toast.error('Vui lòng chọn ít nhất 1 người để tạo nhóm');
                return;
            }

            await createConversation(
                'group',
                groupName,
                invitedUsers.map((u) => u.id),
            );

            setSearch('');
            setInvitedUsers([]);
        } catch (error) {
            console.log('Lỗi xảy ra khi submit, tại newGroupChatModal', error);
        }
    };

    const handleSelectFriend = (friend: Friend) => {
        setInvitedUsers([...invitedUsers, friend]);
        setSearch('');
    };

    const handleRemoveFriend = (friend: Friend) => {
        setInvitedUsers(invitedUsers.filter((u) => u.id !== friend.id));
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    onClick={handleGetFriends}
                    className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent z-10 transition cursor-pointer"
                >
                    <Users className="size-4" />
                    <span className="sr-only">Tạo nhóm</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] border-none">
                <DialogHeader>
                    <DialogTitle className="capitalize">Tạo nhóm chat mới</DialogTitle>
                </DialogHeader>

                <form className="space-x-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="groupName" className="text-sm font-semibold">
                            Tên nhóm
                        </Label>
                        <Input
                            id="groupName"
                            className="glass border-border/50 focus:border-primary transition-smooth"
                            placeholder="Gõ tên nhóm vào đây..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invite" className="text-sm font-semibold">
                            Mời thành viên
                        </Label>
                        <Input
                            id="invite"
                            className="glass border-border/50 focus:border-primary transition-smooth"
                            placeholder="Tìm theo tên hiển thị..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* danh sách gợi ý */}
                    {search && filterFriends.length > 0 && (
                        <InviteSuggestionList filterdFriends={filterFriends} onSelect={handleSelectFriend} />
                    )}

                    {/* danh sách user người dùng đã chọn */}
                    {invitedUsers.length > 0 && (
                        <SelectedUsersList invitedUsers={invitedUsers} onRemove={handleRemoveFriend} />
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
                        >
                            {loading ? (
                                <span>Đang tạo...</span>
                            ) : (
                                <>
                                    <UserPlus className="size-4 mr-2" />
                                    <span>Tạo nhóm</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewGroupChatModal;
