import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ScrapingService {
    private readonly scraperBaseUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.scraperBaseUrl =
            this.configService.get<string>('SCRAPER_BASE_URL') ??
            '';
    }
}