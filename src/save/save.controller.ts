import {
    BadRequestException,
    Controller, Delete,
    Get,
    Param,
    PayloadTooLargeException,
    Post,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard, AuthorizedRequest } from '../auth/auth.guard';
import { SaveDownloadDto } from './dto/save-download.dto';
import { SaveService } from './save.service';
import { v4 as uuidv4 } from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudSave } from '@prisma/client';
import { rmdir, unlink } from 'fs-extra';
import { join } from 'path';

@Controller('save')
export class SaveController {
    constructor(private saveService: SaveService) {}

    @Delete(':uuid/delete')
    @UsePipes(ValidationPipe)
    @UseGuards(AuthGuard)
    async deleteSave(
        @Param() { uuid }: SaveDownloadDto,
        @Req() req: AuthorizedRequest,
    ) {
        await this.saveService.deleteSave(uuid, req.user);

        return { ok: true };
    }

    @Get('list')
    @UseGuards(AuthGuard)
    listSaves(@Req() req: AuthorizedRequest): Promise<CloudSave[]> {
        return this.saveService.listSaves(req.user.id);
    }

    @Get(':uuid')
    @UsePipes(ValidationPipe)
    async downloadSave(
        @Param() { uuid }: SaveDownloadDto,
        @Res() res: Response,
    ) {
        const stream = await this.saveService.getSaveData(uuid);

        res.setHeader(
            'Content-disposition',
            'attachment; filename=omorisave.json',
        );

        stream.pipe(res);
    }

    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async createSave(
        @Req() req: AuthorizedRequest,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException();

        const id = uuidv4();

        const filesize = await this.saveService.createSaveData(id, file.buffer);

        if (filesize + req.user.storageUsage > req.user.storageQuota) {
            const path = await this.saveService.getSavePath(id, true);

            await unlink(path);
            await rmdir(join(path, '..'));

            throw new PayloadTooLargeException(
                'Uploading this file exceeds your storage quota',
            );
        }

        return await this.saveService.createSave(id, req.user, filesize);
    }
}
