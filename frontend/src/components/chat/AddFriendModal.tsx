import type { IUserDetail } from '@/interfaces/user.interface';
import { useFriendStore } from '@/stores/friend.store';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '../ui/dialog';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import SearchForm from '../addFriendModal/SearchForm';
import SendFriendRequest from '../addFriendModal/SendFriendRequest';

export interface IFormValues {
    username: string;
    message: string;
}
const AddFriendModal = () => {
    const [isFound, setIsFound] = useState<boolean | null>(null);
    const [searchUser, setSearchUser] = useState<IUserDetail>();
    const [searchedUsername, setSearchedUsername] = useState<string>('');

    const { loading, searchByUserName, addFriend } = useFriendStore();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<IFormValues>({
        defaultValues: {
            username: '',
            message: '',
        },
    });

    const usernameValue = watch('username');

    const handleSearch = handleSubmit(async (data) => {
        const username = data.username.trim();
        if (!username) return;

        setIsFound(null);
        setSearchedUsername(username);

        try {
            const foundUser = await searchByUserName(username);
            if (foundUser) {
                setIsFound(true);
                setSearchUser(foundUser);
            } else {
                setIsFound(false);
            }
        } catch (error) {
            console.log(error);
            setIsFound(false);
        }
    });

    const handleSend = handleSubmit(async (data) => {
        if (!searchUser) return;
        try {
            const message = await addFriend(searchUser._id, data.message?.trim() || '');
            toast.success(message);

            handleCancel();
        } catch (error) {
            console.log('lỗi xảy ra khi gửi request từ form ', error);
        }
    });

    const handleCancel = () => {
        reset();
        setIsFound(null);
        setSearchedUsername('');
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
                    <UserPlus className="size-4" />
                    <span className="sr-only">Kết bạn</span>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] border-none">
                <DialogHeader>
                    <DialogTitle>Kết bạn</DialogTitle>
                </DialogHeader>
                {isFound ? (
                    <SendFriendRequest
                        register={register}
                        loading={loading}
                        searchedUsername={searchedUsername}
                        onSubmit={handleSend}
                        onBack={() => setIsFound(null)}
                    />
                ) : (
                    <SearchForm
                        register={register}
                        onCancel={handleCancel}
                        onSubmit={handleSearch}
                        searchedUsername={searchedUsername}
                        usernameValue={usernameValue}
                        loading={loading}
                        isFound={isFound}
                        errors={errors}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AddFriendModal;
