import { UserPlus } from 'lucide-react';
import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { IFormValues } from '../chat/AddFriendModal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';

interface SendRequestProps {
    register: UseFormRegister<IFormValues>;
    loading: boolean;
    searchedUsername: string;
    onSubmit?: (e?: React.FormEvent<HTMLFormElement>) => void;
    onBack?: () => void;
}
const SendFriendRequest = ({ register, loading, searchedUsername, onSubmit, onBack }: SendRequestProps) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-4">
                <span className="text-sm text-emerald-500">
                    Tìm thấy <span className="font-semibold">{searchedUsername}</span> rồi nè
                </span>
                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-semibold">
                        Giới thiệu
                    </label>
                    <Textarea
                        className="glass border-border/50 focus:border-primary/50 transition-smooth"
                        placeholder="Chào bạn ~ Có thể kết bạn được không?..."
                        {...register('message')}
                        id="message"
                    />
                </div>

                <DialogFooter>
                    <Button
                        className="flex-1 glass hover:text-destructive"
                        type="button"
                        onClick={onBack}
                        variant="outline"
                    >
                        Quay lại
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth "
                    >
                        {loading ? (
                            <span>Đang gửi...</span>
                        ) : (
                            <>
                                <UserPlus className="size-4 mr-2" />
                                <span>Kết bạn</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </div>
        </form>
    );
};

export default SendFriendRequest;
