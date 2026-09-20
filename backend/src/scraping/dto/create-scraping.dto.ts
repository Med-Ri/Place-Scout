import { IsNotEmpty, IsString } from 'class-validator';

export class CreateScrapingDto {
    @IsString()
    @IsNotEmpty()
    what: string;

    @IsString()
    @IsNotEmpty()
    where: string;
}