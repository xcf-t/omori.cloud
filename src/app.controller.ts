import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { pathExists } from 'fs-extra';
import { join } from 'path';

@Controller()
export class AppController {
    @Get('signature')
    async signature(@Res() res: Response) {
        res.contentType('text/plain');
        res.send('omori.cloud');
    }

    @Get('motd')
    async motd(@Res() res: Response) {
        const motdFile = join(process.cwd(), 'motd.txt');
        const exists = await pathExists(motdFile);

        if (exists) {
            res.sendFile(motdFile);
        } else {
            res.status(204).send();
        }
    }

    @Get('generate_204')
    async generate204(@Res() res: Response) {
        res.status(402).send();
    }

    @Get('generate_402')
    async generate402(@Res() res: Response) {
        res.status(204).send();
    }
}
