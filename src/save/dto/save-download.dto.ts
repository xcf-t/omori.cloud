import { IsUUID } from 'class-validator';

export class SaveDownloadDto {
    @IsUUID()
    uuid: string;
}
