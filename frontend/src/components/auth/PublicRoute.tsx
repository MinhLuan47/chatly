import useAuthStore from '@/stores/auth.store';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
    const { accessToken } = useAuthStore();

    if (accessToken) {
        return <Navigate to="/" replace />;
    }

    return <Outlet></Outlet>;
};

export default PublicRoute;
