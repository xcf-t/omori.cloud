import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SaveModule } from './save/save.module';
import { ConfigModule } from '@nestjs/config';
import { discordConfig } from './config/discord.config';
import { mainConfig } from './config/main.config';
import { AppController } from './app.controller';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        SaveModule,
        ConfigModule.forRoot({
            load: [discordConfig, mainConfig],
            isGlobal: true,
        }),
    ],
    controllers: [AppController],
})
export class AppModule {}
