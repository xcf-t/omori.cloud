import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { join } from 'path';
import { ensureDir, pathExists, rmdir, unlink, readdir } from 'fs-extra';
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

    getSave(id: string): Promise<CloudSave> {
        return this.prismaService.cloudSave.findUnique({
            where: { id },
        });
    }

    async updateSave(id: string, description: string) {
        await this.prismaService.cloudSave.update({
            where: { id },
            data: { description },
        });
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

        await this.deleteSaveFiles(id);
    }

    async deleteSaveFiles(id: string): Promise<void> {
        const dataPath = await this.getSavePath(id, true, '.data');
        const metaPath = await this.getSavePath(id, true, '.meta');

        await unlink(dataPath);
        await unlink(metaPath);

        const fileCount = await readdir(join(dataPath, '..'));
        if (fileCount.length == 0) await rmdir(join(dataPath, '..'));
    }

    async createSave(
        id: string,
        user: User,
        size: number,
        description: string,
    ): Promise<CloudSave> {
        const save = this.prismaService.cloudSave.create({
            data: {
                id,
                creatorId: user.id,
                description,
                size,
            },
        });

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { storageUsage: user.storageUsage + size },
        });

        return save;
    }

    getSaveData(id: string): Promise<Readable> {
        return this.getSaveFile(id, '.data');
    }

    getSaveMeta(id: string): Promise<Readable> {
        return this.getSaveFile(id, '.meta');
    }

    private async getSaveFile(id: string, suffix: string): Promise<Readable> {
        const decompressor = spawn(
            this.zstd,
            [
                '-d',
                '-c',
                '-D',
                'dictionary',
                await this.getSavePath(id, false, suffix),
            ],
            { cwd: join(process.cwd(), 'Saves') },
        );

        return decompressor.stdout;
    }

    public createSaveData(id: string, data: Buffer): Promise<number> {
        return this.createSaveFile(id, data, '.data');
    }

    public createSaveMeta(id: string, data: Buffer): Promise<number> {
        return this.createSaveFile(id, data, '.meta');
    }

    private async createSaveFile(
        id: string,
        data: Buffer,
        suffix: string,
    ): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            const path = await this.getSavePath(id, true, suffix);

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

    async getSavePath(id: string, create = true, suffix = ''): Promise<string> {
        const bucket = id.substring(0, 3);

        const path = join(process.cwd(), 'Saves', bucket, `${id}${suffix}`);

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
