export interface AuthUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    verified: boolean;
    email: string;
    flags: number;
    premium_type: number;
    public_flags: number;
}
