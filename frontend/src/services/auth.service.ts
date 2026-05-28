import type { IUserCreate } from '@/interfaces/user.interface';
import api from '@/lib/axios';

export const authService = {
    signUp: async (data: IUserCreate) => {
        const response = await api.post('/auth/signup', data);
        return response.data;
    },
    signIn: async (username: string, password: string) => {
        const response = await api.post('/auth/signin', { username, password });
        return response.data;
    },
    signOut: async () => {
        const response = await api.post('/auth/signout');
        return response.data;
    },
    refreshToken: async () => {
        const response = await api.post('/auth/refresh');
        return response.data;
    },
    fetchUser: async () => {
        const response = await api.get('/user/me');
        return response.data;
    },
};
