import { LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import useAuthStore from '@/stores/auth.store';

const Logout = () => {
    const { signOut } = useAuthStore();
    return (
        <div className="flex items-center gap-2 cursor-pointer">
            <LogOut className="text-muted-foreground dark:group-focus:text-accent-foreground!" />
            <Button className="-p-0.5" variant="normal" onClick={signOut}>
                Đăng xuất
            </Button>
        </div>
    );
};
export default Logout;
