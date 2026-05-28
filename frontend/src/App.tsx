import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import MainPage from './pages/MainPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import useAuthStore from './stores/auth.store';
import useSocketStore from './stores/socket.store';
import { useThemeStore } from './stores/theme.store';
function App() {
    const { isDark, setTheme } = useThemeStore();
    const { connectSocket, disconnectSocket } = useSocketStore();
    const { accessToken } = useAuthStore();
    useEffect(() => {
        setTheme(isDark);
    }, [isDark, setTheme]);

    useEffect(() => {
        if (accessToken) {
            connectSocket();
        }
        return () => disconnectSocket();
    }, [accessToken, connectSocket, disconnectSocket]);

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route element={<PublicRoute />}>
                        <Route path="/signin" element={<SignInPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                    </Route>

                    {/* private routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<MainPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster />
        </>
    );
}

export default App;
