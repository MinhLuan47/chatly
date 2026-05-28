import { useFriendStore } from '@/stores/friend.store';
import FriendRequestItem from './FriendRequestItem';

const SentRequests = () => {
    const { sentList } = useFriendStore();

    if (!sentList || sentList.length === 0)
        return <p className="text-sm text-muted-foreground">Bạn chưa gửi lời mời kết bạn</p>;

    return (
        <div className="space-y-3">
            {sentList.map((friendRequest) => (
                <FriendRequestItem
                    key={friendRequest._id}
                    requestInfo={friendRequest}
                    type="sent"
                    actions={<p className="text-muted-foreground text-sm">Đang chờ trả lời...</p>}
                />
            ))}
        </div>
    );
};

export default SentRequests;
