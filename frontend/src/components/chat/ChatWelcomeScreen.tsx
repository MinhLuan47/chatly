import { SidebarInset } from '../ui/sidebar';
import ChatWindowHeader from './ChatWindowHeader';

const ChatWelcomeScreen = () => {
    return (
        <SidebarInset className="flex w-full h-full bg-transparent">
            <ChatWindowHeader />
            <div className="flex-1 flex items-center justify-center bg-primary-foreground rounded-2xl  ">
                <div className="text-center">
                    <div className="flex items-center justify-center size-24 mx-auto mb-6 bg-gradient-chat rounded-full shadow-glow pulse-ring">
                        <span>💬💬💬</span>
                    </div>
                    <h3 className="mb-2 text-2xl font-bold bg-gradient-chat bg-clip-text text-transparent">
                        Chào mừng bạn đến với Moij
                    </h3>
                    <p className="text-muted-foreground">Chọn 1 cuộc hội thoại để bắt đầu chat!</p>
                </div>
            </div>
        </SidebarInset>
    );
};

export default ChatWelcomeScreen;
