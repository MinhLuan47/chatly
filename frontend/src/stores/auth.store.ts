import type { IUserCreate, IUserDetail } from '@/interfaces/user.interface';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChatStore } from './chat.store';

interface AuthStore {
    accessToken: string | null;
    user: IUserDetail | null;
    loading: boolean;
    setUser: (user: IUserDetail) => void;
    setAccessToken: (accessToken: string) => void;
    cleanState: () => void;
    signUp: (data: IUserCreate) => Promise<void>;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshToken: () => Promise<void>;
    fetchUser: () => Promise<void>;
}

const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,
            loading: false,
            setUser: (user) => set({ user }),
            setAccessToken: (accessToken) => set({ accessToken }),
            cleanState: () => {
                set({ accessToken: null, user: null, loading: false });
                useChatStore.getState().reset();
                localStorage.clear();
                sessionStorage.clear();
            },
            signUp: async (data) => {
                try {
                    set({ loading: true });
                    await authService.signUp(data);
                    toast.success('Đăng ký thành công');
                } catch (error) {
                    console.log(error);
                    toast.error('Đăng ký thất bại');
                } finally {
                    set({ loading: false });
                }
            },

            signIn: async (username, password) => {
                try {
                    get().cleanState();
                    set({ loading: true });

                    const result = await authService.signIn(username, password);

                    set({ accessToken: result.accessToken });
                    useChatStore.getState().fetchConversations();
                    toast.success('Đăng nhập thành công');
                } catch (error) {
                    console.log('Lỗi tại authStore, signIn: ', error);
                } finally {
                    set({ loading: false });
                }
            },
            signOut: async () => {
                try {
                    set({ loading: true });
                    get().cleanState();
                    await authService.signOut();
                    toast.success('Đăng xuất thành công');
                } catch (error) {
                    console.log(error);
                    toast.error('Đăng xuất thất bại');
                } finally {
                    set({ loading: false });
                }
            },
            refreshToken: async () => {
                try {
                    set({ loading: true });
                    const { user, fetchUser } = get();
                    const result = await authService.refreshToken();
                    set({ accessToken: result.accessToken });

                    if (!user) {
                        await fetchUser();
                    }
                } catch (error: any) {
                    console.log(error?.response?.data?.message);
                    if (get().user) {
                        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                    }
                    get().cleanState();
                } finally {
                    set({ loading: false });
                }
            },
            fetchUser: async () => {
                try {
                    set({ loading: true });
                    const result = await authService.fetchUser();
                    set({ user: result.user });
                } catch (error) {
                    console.log(error);
                    toast.error('Lỗi khi lấy thông tin người dùng');
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }), // chỉ luu tru nguoi dung
        },
    ),
);

export default useAuthStore;
