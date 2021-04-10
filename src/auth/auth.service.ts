import { Injectable } from '@nestjs/common';
import { AuthorizationCode } from 'simple-oauth2';
import { default as fetch } from 'node-fetch';
import { AuthUser } from './auth.types';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UserToken } from '@prisma/client';

@Injectable()
export class AuthService {
    private client: AuthorizationCode;

    constructor(
        private prismaService: PrismaService,
        private configService: ConfigService,
    ) {
        this.client = new AuthorizationCode({
            client: {
                id: this.configService.get<string>('discord.clientId'),
                secret: this.configService.get<string>('discord.clientSecret'),
            },
            auth: {
                tokenHost: 'https://discord.com',
                authorizeHost: 'https://discord.com',
                authorizePath: '/api/oauth2/authorize',
                tokenPath: '/api/oauth2/token',
                revokePath: '/api/oauth2/token/revoke',
            },
        });
    }

    getLoginUrl(): string {
        return this.client.authorizeURL({
            scope: ['identify', 'email'],
            redirect_uri: this.configService.get<string>('discord.redirectUrl'),
        });
    }

    async getToken(code: string): Promise<string> {
        const token = await this.client.getToken({
            scope: ['identify', 'email'],
            redirect_uri: this.configService.get<string>('discord.redirectUrl'),
            code,
        });

        return token.token.access_token;
    }

    async getUserInfo(token: string): Promise<AuthUser> {
        const res = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${token}`,
            },
            method: 'GET',
        });

        return await res.json();
    }

    async createToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            randomBytes(63, (err, buf) => {
                if (err) reject(err);
                else resolve(buf.toString('base64'));
            });
        });
    }

    async revokeToken(token: string): Promise<void> {
        await this.prismaService.userToken.delete({
            where: { token },
        });
    }

    async revokeTokenById(id: string): Promise<void> {
        await this.prismaService.userToken.delete({
            where: { id },
        });
    }

    async revokeAllTokens(user: string): Promise<void> {
        await this.prismaService.userToken.deleteMany({
            where: { userId: user },
        });
    }

    async listTokens(user: string): Promise<UserToken[]> {
        return await this.prismaService.userToken.findMany({
            where: { userId: user },
        });
    }
}
