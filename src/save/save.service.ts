import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { join } from 'path';
import { ensureDir, pathExists, rmdir, unlink } from 'fs-extra';
import { PrismaService } from '../prisma/prisma.service';
import { User, CloudSave } from '@prisma/client';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SaveService {
    private readonly zstd: string;

    constructor(
        private prismaService: PrismaService,
        private configService: ConfigService,
    ) {
        this.zstd = this.configService.get('main.zstd');
    }

    async deleteSave(id: string, user: User): Promise<void> {
        const save = await this.prismaService.cloudSave.findFirst({
            where: { id },
        });

        if (!save) throw new NotFoundException();
        if (save.creatorId != user.id) throw new ForbiddenException();

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { storageUsage: user.storageUsage - save.size },
        });

        await this.prismaService.cloudSave.delete({
            where: { id },
        });

        const path = await this.getSavePath(id, true);

        await unlink(path);
        await rmdir(join(path, '..'));
    }

    async createSave(id: string, user: User, size: number): Promise<CloudSave> {
        const save = this.prismaService.cloudSave.create({
            data: {
                id,
                creatorId: user.id,
                size,
            },
        });

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { storageUsage: user.storageUsage + size },
        });

        return save;
    }

    async getSaveData(id: string): Promise<Readable> {
        const decompressor = spawn(
            this.zstd,
            ['-d', '-c', '-D', 'dictionary', await this.getSavePath(id, false)],
            { cwd: join(process.cwd(), 'Saves') },
        );

        return decompressor.stdout;
    }

    async createSaveData(id: string, data: Buffer): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            const path = await this.getSavePath(id, true);

            const compressor = spawn(
                this.zstd,
                ['--ultra', '-D', 'dictionary', '-'],
                { cwd: join(process.cwd(), 'Saves') },
            );

            compressor.stderr.on('data', (data: Buffer) =>
                console.error(data.toString('utf-8')),
            );

            const out = createWriteStream(path);

            let filesize = 0;

            compressor.stdout.pipe(out);

            compressor.stdout.on(
                'data',
                (data: Buffer) => (filesize += data.length),
            );

            compressor.stdin.write(data, (error) => {
                if (error) reject(error);
                compressor.stdin.end();
            });

            compressor.on('error', (error) => {
                if (error) reject(error);
            });

            compressor.on('close', () => resolve(filesize));
        });
    }

    async getSavePath(id: string, create = true): Promise<string> {
        const bucket = id.substring(0, 3);

        const path = join(process.cwd(), 'Saves', bucket, `${id}`);

        if (create) {
            const dir = join(process.cwd(), 'Saves', bucket);

            await ensureDir(dir);
        } else {
            const exists = await pathExists(path);

            if (!exists) throw new NotFoundException();
        }

        return path;
    }

    listSaves(user: string): Promise<CloudSave[]> {
        return this.prismaService.cloudSave.findMany({
            where: { creatorId: user },
            orderBy: { createdAt: 'desc' },
        });
    }
}
