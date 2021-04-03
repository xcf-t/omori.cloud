import { registerAs } from '@nestjs/config';

export const mainConfig = registerAs('main', () => ({
    port: parseInt(process.env.PORT || '3000'),
    zstd: process.env.ZSTD_PATH || '/usr/bin/zstd',
}));
