import useAuthStore from '@/stores/auth.store.ts';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const { accessToken, user, loading, refreshToken, fetchUser } = useAuthStore();
    const [starting, setStarting] = useState(true);

    useEffect(() => {
        const init = async () => {
            // có thể xảy ra khi refresh trang
            if (!accessToken) {
                await refreshToken();
            }

            if (accessToken && !user) {
                await fetchUser();
            }

            setStarting(false);
        };

        init();
    }, [accessToken, user, refreshToken, fetchUser]);

    if (starting || loading) {
        return <div className="flex h-screen items-center justify-center">Đang tải trang...</div>;
    }

    if (!accessToken) {
        return <Navigate to="/signin" replace />;
    }

    return <Outlet></Outlet>;
};

export default ProtectedRoute;
