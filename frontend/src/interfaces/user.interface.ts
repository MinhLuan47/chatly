export interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    avatarId?: string | null;
    bio?: string | null;
    phone?: string | null;
}

export interface IUserCreate {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
}

export interface IUserDetail {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Friend {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
}

export interface FriendRequest {
    id: string;
    from?: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl?: string;
    };
    to?: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl?: string;
    };
    message: string;
    createdAt: string;
    updatedAt: string;
}
