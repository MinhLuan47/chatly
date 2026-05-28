import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import ProfileCard from './ProfileCard';
import useAuthStore from '@/stores/auth.store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ProfileDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDialog = ({ open, setOpen }: ProfileDialogProps) => {
    const { user } = useAuthStore();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-y-auto p-0 bg-transparent border-0 shadow-2xl">
                <div className="bg-gradient-glass ">
                    <div className="max-w-4xl mx-auto p-4">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold text-foreground">Profile & Settings</DialogTitle>
                        </DialogHeader>

                        <ProfileCard user={user}></ProfileCard>

                        <Tabs className="my-4" defaultValue="personal">
                            <TabsList className="grid grid-cols-3 w-full glass-light">
                                <TabsTrigger value="personal" className="data-[state=active]:glass-strong">
                                    Tài khoản
                                </TabsTrigger>
                                <TabsTrigger value="preferences" className="data-[state=active]:glass-strong">
                                    Cấu hình
                                </TabsTrigger>
                                <TabsTrigger value="security" className="data-[state=active]:glass-strong">
                                    Bảo mật
                                </TabsTrigger>
                                <TabsContent value="personal">
                                    <p>Personal</p>
                                </TabsContent>
                                <TabsContent value="preferences">
                                    <p>Preferences</p>
                                </TabsContent>
                                <TabsContent value="security">
                                    <p>Security</p>
                                </TabsContent>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;
