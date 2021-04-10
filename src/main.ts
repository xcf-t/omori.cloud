import { pathExists, ensureDir } from 'fs-extra';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

(async () => {
    await ensureDir(join(process.cwd(), 'Saves'));

    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.enableCors();

    const config = new DocumentBuilder()
        .setTitle('OmoriCloud')
        .setDescription('Cloud Storage for Omori Saves')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.setBaseViewsDir(join(process.cwd(), 'Views'));
    app.setViewEngine('ejs');

    await app.init();

    const configService = app.get(ConfigService);

    const zstd = configService.get('main.zstd');
    const exists = await pathExists(zstd);

    if (!exists) {
        console.error(`Missing ZSTD at "${zstd}"`);
        return process.exit(-1);
    }

    await app.listen(configService.get('main.port'));
})();
