import { IsEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveUploadDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    @Length(0, 1024)
    description: string;

    @IsEmpty()
    @ApiProperty({ type: 'string', format: 'application/json' })
    save: any;

    @IsEmpty()
    @ApiProperty({ type: 'string', format: 'application/json' })
    meta: any;
}
