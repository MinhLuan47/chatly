import { useFriendStore } from '@/stores/friend.store';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import FriendRequestItem from './FriendRequestItem';

const ReceivedRequests = () => {
    const { acceptRequest, declineRequest, loading, receivedList } = useFriendStore();

    if (!receivedList || receivedList.length === 0) {
        return <p className=" text-sm text-muted-foreground">Bạn chưa có lời mời kết bạn nào.</p>;
    }

    const handleAccept = async (requestId: string) => {
        try {
            await acceptRequest(requestId);
            toast.success('Đã đồng ý kết bạn thành công');
        } catch (error) {
            console.log('Lỗi khi gửi acceptRequest: ', error);
        }
    };

    const handleDecline = async (requestId: string) => {
        try {
            await declineRequest(requestId);
            toast.error('Đã từ chối kết bạn');
        } catch (error) {
            console.log('Lỗi khi gửi declineRequest: ', error);
        }
    };

    return (
        <div className="space-y-3 mt-4">
            {receivedList.map((friendRequest) => (
                <FriendRequestItem
                    key={friendRequest._id}
                    requestInfo={friendRequest}
                    type="received"
                    actions={
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleAccept(friendRequest._id)}
                                disabled={loading}
                            >
                                Chấp nhận
                            </Button>

                            <Button
                                size="sm"
                                variant="destructiveOutline"
                                onClick={() => handleDecline(friendRequest._id)}
                                disabled={loading}
                            >
                                Từ chối
                            </Button>
                        </div>
                    }
                />
            ))}
        </div>
    );
};

export default ReceivedRequests;
