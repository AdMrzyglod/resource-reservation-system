export interface User {
    id: number;
    email: string;
    username: string;
    role: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
}

export interface ProfileData {
    id?: number | string;
    user?: number | string;
    is_complete?: boolean;
    bank_account_number?: string;
    [key: string]: any;
}