import api from '@/lib/axios';

export const userService = {
    uploadAvatar: async (data: FormData) => {
        const response = await api.post('/user/uploadAvatar', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.status === 400) throw new Error(response.data.message);
        return response.data;
    },
    updateProfile: async (data: { displayName: string; bio?: string; phone?: string; email?: string }) => {
        const response = await api.put('/user/profile', data);
        return response.data;
    },
    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await api.put('/user/change-password', data);
        return response.data;
    },
};
