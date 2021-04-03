import { registerAs } from '@nestjs/config';

export const discordConfig = registerAs('discord', () => ({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUrl: process.env.DISCORD_REDIRECT_URL,
}));
