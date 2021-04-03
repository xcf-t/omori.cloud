import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SaveController } from './save.controller';
import { SaveService } from './save.service';

@Module({
    imports: [PrismaModule],
    controllers: [SaveController],
    providers: [SaveService],
})
export class SaveModule {}
