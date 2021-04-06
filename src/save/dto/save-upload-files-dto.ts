export class SaveUploadFilesDto {
    save?: [SaveUploadFile];
    meta?: [SaveUploadFile];
}

export type SaveUploadFile = {
    filename: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
};
