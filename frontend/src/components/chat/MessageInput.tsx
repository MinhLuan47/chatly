import useAuthStore from '@/stores/auth.store';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import EmojiPicker from './EmojiPicker';
import type { IConversation } from '@/interfaces/chat.interface';
import { useChatStore } from '@/stores/chat.store';
import toast from 'react-hot-toast';
import { chatService } from '@/services/chat.service';

const MessageInput = ({ selectedConver }: { selectedConver: IConversation }) => {
    const { user } = useAuthStore();
    const [value, setValue] = React.useState<string>('');
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [isUploading, setIsUploading] = React.useState<boolean>(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const { sendDirectMessage, sendGroupMessage } = useChatStore();

    if (!user) return;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendMessage = async () => {
        if (!value.trim() && !imageFile) return;

        const currentValue = value;
        const currentImageFile = imageFile;

        setValue('');
        removeImage();

        try {
            let imgUrl = undefined;
            if (currentImageFile) {
                setIsUploading(true);
                imgUrl = await chatService.uploadImage(currentImageFile);
            }

            if (selectedConver.type === 'direct') {
                const paticipants = selectedConver.participants;
                const otherUser = paticipants.filter((p) => p.id !== user.id);
                await sendDirectMessage(otherUser[0].id, currentValue, imgUrl);
            } else {
                await sendGroupMessage(selectedConver.id, currentValue, imgUrl);
            }
        } catch (error) {
            console.log(error);
            toast.error('Lỗi khi gửi tin nhắn ! Hãy thử lại');
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };
    return (
        <div className="flex flex-col bg-background border-t border-border/40">
            {/* Image Preview Bar */}
            {imagePreview && (
                <div className="p-3 flex items-center gap-3 bg-muted/40 border-b border-border/20">
                    <div className="relative size-16 rounded-md overflow-hidden border border-border">
                        <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                        <button
                            onClick={removeImage}
                            className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-smooth"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {imageFile?.name} ({( (imageFile?.size ?? 0) / 1024 ).toFixed(1)} KB)
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 min-h-14 p-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    data-testid="image-input"
                />
                <Button
                    variant={'ghost'}
                    className="hover:bg-primary/10 transition-smooth cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="upload-image-btn"
                >
                    <ImagePlus className="size-4" />
                </Button>

                <div className="flex-1 relative">
                    <Input
                        className="h-9 pr-20 border-border/50 focus:border-primary/50 bg-white resize-none transition-smooth"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={isUploading ? "Đang tải ảnh lên..." : "Nhập tin nhắn..."}
                        onKeyPress={handleKeyPress}
                        disabled={isUploading}
                        data-testid="message-input"
                    ></Input>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <Button
                            asChild
                            variant={'ghost'}
                            size={'icon'}
                            className=" size-8 hover:bg-primary/10 transition-smooth cursor-pointer"
                            disabled={isUploading}
                        >
                            <div>
                                <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} />
                            </div>
                        </Button>
                    </div>
                </div>

                <Button
                    className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 cursor-pointer"
                    disabled={(!value.trim() && !imageFile) || isUploading}
                    onClick={sendMessage}
                    data-testid="send-msg-btn"
                >
                    {isUploading ? (
                        <Loader2 className="size-4 text-white animate-spin" />
                    ) : (
                        <Send className="size-4 text-white" />
                    )}
                </Button>
            </div>
        </div>
    );
};

export default MessageInput;
