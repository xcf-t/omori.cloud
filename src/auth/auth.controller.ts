import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Param,
    Query,
    Redirect,
    Req,
    Res,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import { AuthGuard, AuthorizedRequest } from './auth.guard';
import { RevokeTokenDto } from './dto/revoke-token.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private prismaService: PrismaService,
    ) {}

    @Get('login')
    @Redirect()
    async login() {
        return { url: this.authService.getLoginUrl() };
    }

    @Delete('revoke-all')
    @UseGuards(AuthGuard)
    async revokeAll(@Req() req: AuthorizedRequest) {
        await this.authService.revokeAllTokens(req.user.id);

        return { ok: true };
    }

    @Delete('revoke-current')
    @UseGuards(AuthGuard)
    async revoke(@Req() req: AuthorizedRequest) {
        await this.authService.revokeToken(req.headers.authorization);

        return { ok: true };
    }

    @Delete('revoke/:uuid')
    @UseGuards(AuthGuard)
    @UsePipes(ValidationPipe)
    async revokeById(
        @Req() req: AuthorizedRequest,
        @Param() { uuid }: RevokeTokenDto,
    ) {
        await this.authService.revokeTokenById(uuid);

        return { ok: true };
    }

    @Get('tokens')
    @UseGuards(AuthGuard)
    async listTokens(@Req() req: AuthorizedRequest) {
        return await this.authService.listTokens(req.user.id);
    }

    @Get('callback')
    async callback(@Res() res: Response, @Query('code') code: string) {
        if (!code) throw new BadRequestException('Missing code');

        try {
            const token = await this.authService.getToken(code);
            const userinfo = await this.authService.getUserInfo(token);

            let user = await this.prismaService.user.findUnique({
                where: { id: userinfo.id },
            });

            if (!user)
                user = await this.prismaService.user.create({
                    data: {
                        id: userinfo.id,
                        name: userinfo.username,
                        discriminator: userinfo.discriminator,
                        avatar: userinfo.avatar,
                        email: userinfo.email,
                    },
                });
            else if (
                user.name != userinfo.username ||
                user.discriminator != userinfo.discriminator ||
                user.avatar != userinfo.avatar
            )
                user = await this.prismaService.user.update({
                    where: { id: userinfo.id },
                    data: {
                        name: userinfo.username,
                        avatar: userinfo.avatar,
                        discriminator: userinfo.discriminator,
                    },
                });

            const userToken = await this.prismaService.userToken.create({
                data: {
                    userId: userinfo.id,
                    token: await this.authService.createToken(),
                },
            });

            /*res.json({
                token: userToken.token,
                user: user.id,
                name: user.name,
                discriminator: user.discriminator,
            });*/

            res.render('token', {
                tag: `${user.name}#${user.discriminator}`,
                token: userToken.token,
            });
        } catch (e) {
            res.json({ error: 'Please try again' });
        }
    }

    @Get('check')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Returned when the token is valid',
    })
    @ApiResponse({
        status: 403,
        description: 'Returned when the token is invalid',
    })
    async check() {
        return { ok: true };
    }

    @Get('info')
    @UseGuards(AuthGuard)
    async info(@Req() req: AuthorizedRequest) {
        return req.user;
    }
}
