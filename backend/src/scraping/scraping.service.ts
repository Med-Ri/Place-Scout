import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

    async createJob() {
        const response = await firstValueFrom(
            this.httpService.post(`${this.scraperBaseUrl}/api/v1/jobs`, {
                name: 'placescout-test',
                keywords: ['Italian restaurants'],
                lang: 'en',
                zoom: 14,
                lat: '48.8566',
                lon: '2.3522',
                fast_mode: true,
                radius: 5000,
                depth: 1,
                email: false,
                max_time: 60,
                proxies: [],
            }),
        );

        return response.data;
    }

    async getJobStatus(jobId: string) {
        const response = await firstValueFrom(
            this.httpService.get(
                `${this.scraperBaseUrl}/api/v1/jobs/${jobId}`,
            ),
        );

        return response.data;
    }
}