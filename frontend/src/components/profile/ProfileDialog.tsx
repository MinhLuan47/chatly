import { useState, type Dispatch, type SetStateAction, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import ProfileCard from './ProfileCard';
import useAuthStore from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { userService } from '@/services/user.service';
import toast from 'react-hot-toast';
import { User, FileText, Phone, Mail, Lock, Bell, Volume2, Palette, Loader2, Check } from 'lucide-react';

interface ProfileDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDialog = ({ open, setOpen }: ProfileDialogProps) => {
    const { user, setUser, fetchUser } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();

    // Personal states
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [personalLoading, setPersonalLoading] = useState(false);

    // Security states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);

    // Preferences (Configuration) states
    const [notificationSound, setNotificationSound] = useState(true);
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [primaryThemeColor, setPrimaryThemeColor] = useState('indigo');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setBio(user.bio || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
        }
    }, [user, open]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            toast.error('Tên hiển thị không được để trống');
            return;
        }

        try {
            setPersonalLoading(true);
            const response = await userService.updateProfile({
                displayName,
                bio,
                phone,
                email
            });
            if (response.success) {
                setUser(response.user);
                toast.success('Cập nhật thông tin thành công!');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin cá nhân');
        } finally {
            setPersonalLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            toast.error('Vui lòng điền đầy đủ mật khẩu');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải từ 6 ký tự trở lên');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Xác nhận mật khẩu mới không khớp');
            return;
        }

        try {
            setSecurityLoading(true);
            const response = await userService.changePassword({
                currentPassword,
                newPassword
            });
            if (response.success) {
                toast.success('Đổi mật khẩu thành công!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setSecurityLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-xl overflow-y-auto max-h-[85vh] p-0 bg-slate-900/90 border border-slate-700/50 backdrop-blur-xl shadow-2xl rounded-2xl text-slate-100">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold tracking-wide bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Profile & Settings
                        </DialogTitle>
                    </DialogHeader>

                    <ProfileCard user={user}></ProfileCard>

                    <Tabs className="my-6" defaultValue="personal">
                        <TabsList className="grid grid-cols-3 w-full bg-slate-950/60 p-1 border border-slate-800/80 rounded-lg">
                            <TabsTrigger 
                                value="personal" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400 transition-all font-medium py-1.5 rounded-md text-xs"
                            >
                                Tài khoản
                            </TabsTrigger>
                            <TabsTrigger 
                                value="preferences" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400 transition-all font-medium py-1.5 rounded-md text-xs"
                            >
                                Cấu hình
                            </TabsTrigger>
                            <TabsTrigger 
                                value="security" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400 transition-all font-medium py-1.5 rounded-md text-xs"
                            >
                                Bảo mật
                            </TabsTrigger>
                        </TabsList>

                        {/* TabsContent outside TabsList to avoid broken layout */}
                        <TabsContent value="personal" className="mt-4 focus-visible:outline-none">
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="displayName" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <User className="size-3.5 text-indigo-400" /> Tên hiển thị
                                    </Label>
                                    <Input
                                        id="displayName"
                                        type="text"
                                        placeholder="Nhập tên hiển thị"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="bio" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <FileText className="size-3.5 text-indigo-400" /> Tiểu sử
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Mô tả bản thân một chút nào..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200 min-h-[60px]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Phone className="size-3.5 text-indigo-400" /> Số điện thoại
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        placeholder="Nhập số điện thoại"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-indigo-400" /> Địa chỉ Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Nhập email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={personalLoading}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-1.5 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/10 text-xs flex items-center gap-1.5 transition-all"
                                    >
                                        {personalLoading && <Loader2 className="size-3.5 animate-spin" />}
                                        Lưu thay đổi
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="preferences" className="mt-4 focus-visible:outline-none space-y-5">
                            {/* Theme option */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-850/60 rounded-xl">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                        <Palette className="size-3.5 text-indigo-400" /> Chế độ tối (Dark Mode)
                                    </Label>
                                    <p className="text-[10px] text-slate-400">Thay đổi chủ đề hiển thị của ứng dụng</p>
                                </div>
                                <Switch
                                    checked={isDark}
                                    onCheckedChange={toggleTheme}
                                    className="data-[state=checked]:bg-indigo-600"
                                />
                            </div>

                            {/* Sound notification */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-850/60 rounded-xl">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                        <Volume2 className="size-3.5 text-indigo-400" /> Âm thanh thông báo
                                    </Label>
                                    <p className="text-[10px] text-slate-400">Phát âm thanh khi có tin nhắn mới</p>
                                </div>
                                <Switch
                                    checked={notificationSound}
                                    onCheckedChange={setNotificationSound}
                                    className="data-[state=checked]:bg-indigo-600"
                                />
                            </div>

                            {/* Show online status */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-850/60 rounded-xl">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                        <Bell className="size-3.5 text-indigo-400" /> Trạng thái hoạt động
                                    </Label>
                                    <p className="text-[10px] text-slate-400">Hiển thị trạng thái hoạt động với mọi người</p>
                                </div>
                                <Switch
                                    checked={showOnlineStatus}
                                    onCheckedChange={setShowOnlineStatus}
                                    className="data-[state=checked]:bg-indigo-600"
                                />
                            </div>

                            {/* Accent theme color picker */}
                            <div className="p-3.5 bg-slate-950/30 border border-slate-850/60 rounded-xl space-y-2.5">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                        Màu sắc chủ đạo (Accent Color)
                                    </Label>
                                    <p className="text-[10px] text-slate-400">Chọn tông màu tạo điểm nhấn cho giao diện</p>
                                </div>
                                <div className="flex gap-2">
                                    {['indigo', 'emerald', 'amber', 'rose'].map((color) => {
                                        const colorClasses: Record<string, string> = {
                                            indigo: 'bg-indigo-600 hover:bg-indigo-500',
                                            emerald: 'bg-emerald-600 hover:bg-emerald-500',
                                            amber: 'bg-amber-600 hover:bg-amber-500',
                                            rose: 'bg-rose-600 hover:bg-rose-500',
                                        };
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setPrimaryThemeColor(color)}
                                                className={`size-6 rounded-full flex items-center justify-center transition-all ${colorClasses[color]}`}
                                            >
                                                {primaryThemeColor === color && <Check className="size-3 text-white" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="security" className="mt-4 focus-visible:outline-none">
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="currentPassword" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Lock className="size-3.5 text-indigo-400" /> Mật khẩu hiện tại
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        placeholder="Nhập mật khẩu hiện tại"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="newPassword" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Lock className="size-3.5 text-indigo-400" /> Mật khẩu mới
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword" className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Lock className="size-3.5 text-indigo-400" /> Xác nhận mật khẩu mới
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-slate-950/40 border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm py-2 rounded-lg text-slate-200"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={securityLoading}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-1.5 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/10 text-xs flex items-center gap-1.5 transition-all"
                                    >
                                        {securityLoading && <Loader2 className="size-3.5 animate-spin" />}
                                        Đổi mật khẩu
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;
