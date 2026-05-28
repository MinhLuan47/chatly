'use client';

import * as React from 'react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '../ui/switch';
import CreateNewChat from '../chat/CreateNewChat';
import NewGroupChatModal from '../chat/NewGroupChatModal';
import GroupChatList from '../chat/GroupChatList';
import AddFriendModal from '../chat/AddFriendModal';
import DirectMessageList from '../chat/DirectMessageList';
import { useThemeStore } from '@/stores/theme.store';
import { NavUser } from './nav-user';
import useAuthStore from '@/stores/auth.store';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { isDark, toggleTheme } = useThemeStore();
    const { user } = useAuthStore();
    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="bg-gradient-primary">
                            <a href="#">
                                <div className="flex w-full items-center justify-between px-2">
                                    <h1 className="text-xl font-bold text-white">Chatly</h1>
                                    <div className="flex items-center gap-2">
                                        <Sun className="text-white/80 size-4" />
                                        <Switch
                                            className="data-[state=checked]:bg-background/80"
                                            checked={isDark}
                                            onCheckedChange={toggleTheme}
                                        />
                                        <Moon className="text-white/80 size-4" />
                                    </div>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* New chat */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <CreateNewChat />
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Group chat list */}
                <SidebarGroup>
                    <div className="flex items-center justify-between">
                        <SidebarGroupLabel className="uppercase">nhóm chat</SidebarGroupLabel>
                        <NewGroupChatModal />
                    </div>

                    <SidebarGroupContent>
                        <GroupChatList />
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Direct messages */}
                <SidebarGroup>
                    <SidebarGroupLabel className="uppercase">Bạn bè</SidebarGroupLabel>

                    <SidebarGroupAction title="Kết bạn" className="cursor-pointer">
                        <AddFriendModal />
                    </SidebarGroupAction>

                    <SidebarGroupContent>
                        <DirectMessageList />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
        </Sidebar>
    );
}
