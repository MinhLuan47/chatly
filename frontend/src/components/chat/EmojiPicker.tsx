import { useThemeStore } from '@/stores/theme.store';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Smile } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerProps {
    onChange: (value: string) => void;
}
const EmojiPicker: React.FC<EmojiPickerProps> = ({ onChange }) => {
    const { isDark } = useThemeStore();

    return (
        <Popover>
            <PopoverTrigger>
                <Smile className="size-4" />
            </PopoverTrigger>

            <PopoverContent
                sideOffset={40}
                side="right"
                className="mb-12 bg-transparent border-none shadow-none drop-shadow-none "
            >
                <Picker
                    theme={isDark ? 'dark' : 'light'}
                    data={data}
                    onEmojiSelect={(emoji: any) => onChange(emoji.native)}
                />
            </PopoverContent>
        </Popover>
    );
};

export default EmojiPicker;
