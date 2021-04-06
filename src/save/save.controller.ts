import {
    BadRequestException,
    Body,
    Controller,
    Delete, ForbiddenException,
    Get, NotFoundException,
    Param,
    Patch,
    PayloadTooLargeException,
    Post,
    Req,
    Res,
    UploadedFile,
    UploadedFiles,
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
import {
    FileFieldsInterceptor,
    FileInterceptor,
} from '@nestjs/platform-express';
import { CloudSave } from '@prisma/client';
import { rmdir, unlink } from 'fs-extra';
import { join } from 'path';
import { SaveUploadDto } from './dto/save-upload.dto';
import { SaveUploadFilesDto } from './dto/save-upload-files-dto';

@Controller('save')
export class SaveController {
    constructor(private saveService: SaveService) {}

    @Delete(':uuid')
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

    @Get(':uuid/data')
    @UsePipes(ValidationPipe)
    async downloadSaveData(
        @Param() { uuid }: SaveDownloadDto,
        @Res() res: Response,
    ) {
        const stream = await this.saveService.getSaveData(uuid);

        res.setHeader(
            'Content-disposition',
            'attachment; filename=save.rpgsave',
        );

        stream.pipe(res);
    }

    @Get(':uuid/meta')
    @UsePipes(ValidationPipe)
    async downloadSaveMeta(
        @Param() { uuid }: SaveDownloadDto,
        @Res() res: Response,
    ) {
        const stream = await this.saveService.getSaveMeta(uuid);

        res.setHeader(
            'Content-disposition',
            'attachment; filename=global.rpgsave',
        );

        stream.pipe(res);
    }

    @Patch(':uuid')
    @UsePipes(ValidationPipe)
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'save', maxCount: 1 },
            { name: 'meta', maxCount: 1 },
        ]),
    )
    async updateSave(
        @Req() req: AuthorizedRequest,
        @UploadedFiles() files: SaveUploadFilesDto,
        @Body() { description }: SaveUploadDto,
        @Param() { uuid }: SaveDownloadDto,
    ) {
        if (!files.meta || !files.save) throw new BadRequestException();

        if (req.user.storageUsage > req.user.storageQuota)
            throw new PayloadTooLargeException('You have exceeded your quota!');

        const save = await this.saveService.getSave(uuid);

        if (!save) throw new NotFoundException();
        if (save.creatorId != req.user.id) throw new ForbiddenException();

        if (description) await this.saveService.updateSave(uuid, description);

        await this.saveService.deleteSaveFiles(uuid);

        const dataSize = await this.saveService.createSaveData(
            uuid,
            files.save[0].buffer,
        );

        const metaSize = await this.saveService.createSaveData(
            uuid,
            files.meta[0].buffer,
        );
    }

    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'save', maxCount: 1 },
            { name: 'meta', maxCount: 1 },
        ]),
    )
    async createSave(
        @Req() req: AuthorizedRequest,
        @Body() { description }: SaveUploadDto,
        @UploadedFiles() files: SaveUploadFilesDto,
    ) {
        if (!files.meta || !files.save) throw new BadRequestException();

        const id = uuidv4();

        const dataSize = await this.saveService.createSaveData(
            id,
            files.save[0].buffer,
        );

        const metaSize = await this.saveService.createSaveData(
            id,
            files.meta[0].buffer,
        );

        if (
            dataSize + metaSize + req.user.storageUsage >
            req.user.storageQuota
        ) {
            await this.saveService.deleteSaveFiles(id);

            throw new PayloadTooLargeException(
                'Uploading this file exceeds your storage quota',
            );
        }

        return await this.saveService.createSave(
            id,
            req.user,
            dataSize,
            description,
        );
    }
}
