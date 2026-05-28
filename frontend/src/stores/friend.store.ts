import type { Friend, FriendRequest, IUserDetail } from '@/interfaces/user.interface';
import { friendService } from '@/services/friend.service';
import { create } from 'zustand';

interface FriendState {
    loading: boolean;
    friends: Friend[];
    sentList: FriendRequest[];
    receivedList: FriendRequest[];
    searchByUserName: (username: string) => Promise<IUserDetail | null>;
    addFriend: (to: string, message?: string) => Promise<string>;
    getAllFriendRequest: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    declineRequest: (requestId: string) => Promise<void>;
    getFriends: () => Promise<void>;
}

export const useFriendStore = create<FriendState>()((set) => ({
    loading: false,
    friends: [],
    receivedList: [],
    sentList: [],
    searchByUserName: async (username) => {
        try {
            set({ loading: true });
            const user = await friendService.searchByUserName(username);

            return user;
        } catch (error) {
            console.log('Lỗi xảy ra khi tìm user bằng username ', error);
            return null;
        } finally {
            set({ loading: false });
        }
    },
    addFriend: async (to, message) => {
        try {
            const resultMessage = await friendService.sendFriendRequest(to, message);
            return resultMessage;
        } catch (error) {
            console.log('Lỗi xảy ra khi addFriend  ', error);
            return 'Lỗi xảy ra khi gửi lời mời kết bạn ';
        } finally {
            set({ loading: false });
        }
    },
    getAllFriendRequest: async () => {
        try {
            set({ loading: true });
            const result = await friendService.getAllFriendRequests();
            if (!result) return;
            const { received, sent } = result;
            set({ sentList: sent, receivedList: received });
        } catch (error) {
            console.log('Lỗi xảy ra khi getAllFriendRequest  ', error);
        } finally {
            set({ loading: false });
        }
    },
    acceptRequest: async (requestId) => {
        try {
            set({ loading: true });
            await friendService.acceptRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((item) => item._id !== requestId),
            }));
        } catch (error) {
            console.log('Lỗi xảy ra khi acceptRequest  ', error);
        } finally {
            set({ loading: false });
        }
    },
    declineRequest: async (requestId) => {
        try {
            set({ loading: true });
            await friendService.declineRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((item) => item._id !== requestId),
            }));
        } catch (error) {
            console.log('Lỗi xảy ra khi declineRequest  ', error);
        } finally {
            set({ loading: false });
        }
    },
    getFriends: async () => {
        try {
            set({ loading: true });
            const friends = await friendService.getFriends();
            set({ friends });
        } catch (error) {
            console.log('Lỗi xảy ra khi getFriends  ', error);
            set({ friends: [] });
        } finally {
            set({ loading: false });
        }
    },
}));
