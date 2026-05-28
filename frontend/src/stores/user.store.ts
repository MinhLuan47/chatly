import { userService } from '@/services/user.service';
import { create } from 'zustand';
import useAuthStore from './auth.store';
import toast from 'react-hot-toast';
import { useChatStore } from './chat.store';

interface UserState {
    updateAvatarUrl: (formData: FormData) => Promise<void>;
}

export const useUserStore = create<UserState>()(() => ({
    updateAvatarUrl: async (formData) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);
            if (user) {
                setUser({ ...user, avatarUrl: data.avatarUrl });
                useChatStore.getState().fetchConversations();
            }
        } catch (error) {
            toast.error('Upload avatar không thành công');
            console.log('Lỗi khi upload avatar: ', error);
        }
    },
}));
