import api from '@/lib/axios';

export const friendService = {
    searchByUserName: async (username: string) => {
        const response = await api.get('/user/search?username=' + username);
        return response.data.user;
    },

    sendFriendRequest: async (to: string, message?: string) => {
        const response = await api.post('/friends/requests', { to, message });
        return response.data.message;
    },
    getAllFriendRequests: async () => {
        try {
            const response = await api.get('/friends/requests');
            const { sent, received } = response.data;
            return { sent, received };
        } catch (error) {
            console.log('Lỗi khi gửi getAllFriendRequests: ', error);
        }
    },
    acceptRequest: async (requestId: string) => {
        try {
            const response = await api.post(`/friends/requests/${requestId}/accept`);
            return response.data;
        } catch (error) {
            console.log('Lỗi khi gửi acceptRequest: ', error);
        }
    },
    declineRequest: async (requestId: string) => {
        try {
            await api.post(`/friends/requests/${requestId}/decline`);
        } catch (error) {
            console.log('Lỗi khi gửi declineRequest: ', error);
        }
    },
    getFriends: async () => {
        try {
            const response = await api.get('/friends');
            console.log(response.data.friends);
            return response.data.friends;
        } catch (error) {
            console.log('Lỗi khi gửi getFriends: ', error);
        }
    },
};
