import 'express';
declare global {
    namespace Express {
        interface Request {
            user: {
                _id: string | null | undefined;
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
