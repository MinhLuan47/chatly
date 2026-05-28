import 'express';
declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                username: string;
                email: string;
                displayName: string;
                avatarUrl?: string | null;
                avatarId?: string | null;
                bio?: string | null;
                phone?: string | null;
            };
        }
    }
}
