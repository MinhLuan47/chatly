import useAuthStore from '@/stores/auth.store';
import { ImagePlus, Send } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import EmojiPicker from './EmojiPicker';
import type { IConversation } from '@/interfaces/chat.interface';
import { useChatStore } from '@/stores/chat.store';
import toast from 'react-hot-toast';

const MessageInput = ({ selectedConver }: { selectedConver: IConversation }) => {
    const { user } = useAuthStore();
    const [value, setValue] = React.useState<string>('');
    const { sendDirectMessage, sendGroupMessage } = useChatStore();

    if (!user) return;

    const sendMessage = async () => {
        if (!value.trim()) return;

        const currentValue = value;
        setValue('');

        try {
            if (selectedConver.type === 'direct') {
                const paticipants = selectedConver.participants;
                const otherUser = paticipants.filter((p) => p._id !== user._id);
                await sendDirectMessage(otherUser[0]._id, currentValue);
            } else {
                await sendGroupMessage(selectedConver._id, currentValue);
            }
        } catch (error) {
            console.log(error);
            toast.error('Lỗi khi gửi tin nhắn ! Hãy thử lại');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };
    return (
        <div className="flex items-center gap-2 min-h-14 p-3 bg-background ">
            <Button variant={'ghost'} className="hover:bg-primary/10 transition-smooth">
                <ImagePlus className="size-4" />
            </Button>

            <div className="flex-1 relative">
                <Input
                    className="h-9 pr-20 border-border/50 focus:border-primary/50 bg-white resize-none transition-smooth"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    onKeyPress={handleKeyPress}
                ></Input>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Button
                        asChild
                        variant={'ghost'}
                        size={'icon'}
                        className=" size-8 hover:bg-primary/10 transition-smooth"
                    >
                        <div>
                            <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} />
                        </div>
                    </Button>
                </div>
            </div>

            <Button
                className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
                disabled={!value.trim()}
                onClick={sendMessage}
            >
                <Send className="size-4 text-white" />
            </Button>
        </div>
    );
};

export default MessageInput;
