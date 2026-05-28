export interface IUserCreate {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    avatarId?: string;
    bio?: string;
    phone?: string | null;
}
