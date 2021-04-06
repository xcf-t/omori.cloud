import { IsOptional, IsString, Length } from 'class-validator';

export class SaveUploadDto {
    @IsString()
    @IsOptional()
    @Length(0, 1024)
    description: string;
}