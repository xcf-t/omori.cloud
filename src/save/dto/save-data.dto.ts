import { ApiProperty } from '@nestjs/swagger';

export class SaveDataDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    creatorId: string;

    @ApiProperty()
    size: number;
}
