import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
    @Get('signature')
    async signature(@Res() res: Response) {
        res.contentType('text/plain');
        res.send('omori.cloud');
    }
}
