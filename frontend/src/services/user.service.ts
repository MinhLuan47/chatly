import api from '@/lib/axios';

export const userService = {
    uploadAvatar: async (data: FormData) => {
        const response = await api.post('/user/uploadAvatar', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.status === 400) throw new Error(response.data.message);
        return response.data;
    },
};
