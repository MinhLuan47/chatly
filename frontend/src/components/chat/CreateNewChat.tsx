import { useFriendStore } from '@/stores/friend.store';
import { Card } from '../ui/card';
import { Dialog, DialogTrigger } from '../ui/dialog';
import { MessageCircle } from 'lucide-react';

const CreateNewChat = () => {
    const { getFriends } = useFriendStore();

    const handleGetFriends = async () => {
        await getFriends();
    };

    return (
        <div className="flex gap-2">
            <Card
                className="flex-1 p-3 glass hover:shadow-soft transition-smooth cursor-pointer group/card"
                onClick={handleGetFriends}
            >
                <Dialog>
                    <DialogTrigger>
                        <div className=" flex items-center gap-4">
                            <div className="size-8 bg-gradient-chat rounded-full flex items-center justify-center group-hover/card:scale-110 transition-bounce">
                                <MessageCircle className="text-white size-4" />
                            </div>
                            <span className="capitalize text-sm font-medium">Gửi tin nhắn mới</span>
                        </div>
                    </DialogTrigger>
                </Dialog>
            </Card>
        </div>
    );
};

export default CreateNewChat;
