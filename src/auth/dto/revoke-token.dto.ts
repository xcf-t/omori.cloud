import { IsUUID } from 'class-validator';

export class RevokeTokenDto {
    @IsUUID()
    uuid: string;
}
