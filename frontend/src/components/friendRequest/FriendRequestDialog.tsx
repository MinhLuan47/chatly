import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useFriendStore } from '@/stores/friend.store';
import SentRequests from './SentRequests';
import ReceivedRequests from './ReceivedRequests';

interface FriendRequestDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const FriendRequestDialog = ({ open, setOpen }: FriendRequestDialogProps) => {
    const [tab, setTab] = useState('received');
    const { getAllFriendRequest } = useFriendStore();

    useEffect(() => {
        const loadRequests = async () => {
            try {
                await getAllFriendRequest();
            } catch (error) {
                console.log('Lỗi khi load requests: ', error);
            }
        };

        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg ">
                <DialogHeader>
                    <DialogTitle>Lời mời kết bạn</DialogTitle>
                </DialogHeader>
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className="grid  grid-cols-2 w-full">
                        <TabsTrigger value="received">Đã nhận</TabsTrigger>
                        <TabsTrigger value="sent">Đã gửi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="received">
                        <ReceivedRequests />
                    </TabsContent>
                    <TabsContent value="sent">
                        <SentRequests />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default FriendRequestDialog;
