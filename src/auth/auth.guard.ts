import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export type AuthorizedRequest = Request & { user: User };

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private prismaService: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<AuthorizedRequest>();

        if (!req.headers.authorization) return false;

        const token = await this.prismaService.userToken.findUnique({
            rejectOnNotFound: false,
            where: { token: req.headers.authorization },
            include: { user: true },
        });

        if (!token) return false;

        req.user = token.user;

        return true;
    }
}
