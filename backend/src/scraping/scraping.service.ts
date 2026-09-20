import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { parse } from 'csv-parse/sync';
import { BusinessesService } from '../businesses/businesses.service';
import { GeocodingService } from '../geocoding/geocoding.service';

@Injectable()
export class ScrapingService {
    private readonly scraperBaseUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly businessesService: BusinessesService,
        private readonly geocodingService: GeocodingService,
    ) {
        this.scraperBaseUrl =
            this.configService.get<string>('SCRAPER_BASE_URL') ??
            '';
    }

    async createJob(what: string, where: string) {
        const response = await firstValueFrom(
            this.httpService.post(`${this.scraperBaseUrl}/api/v1/jobs`, {
                name: 'placescout-test',
                keywords: [what],
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

    async downloadJobResults(jobId: string) {
        const response = await firstValueFrom(
            this.httpService.get(
                `${this.scraperBaseUrl}/api/v1/jobs/${jobId}/download`,
                {
                    responseType: 'text',
                },
            ),
        );

        return parse(response.data, {
            columns: true,
            skip_empty_lines: true,
        }) as Record<string, string>[];
    }

    private mapScraperBusiness(row: Record<string, string>) {
        return {
            name: row.title?.trim(),
            category: row.category?.trim() || undefined,
            address: row.address?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            website: row.website?.trim() || undefined,
            rating: row.review_rating
                ? Number(row.review_rating)
                : undefined,
            reviewCount: row.review_count
                ? Number(row.review_count)
                : undefined,
            latitude: row.latitude
                ? Number(row.latitude)
                : undefined,
            longitude: row.longitude
                ? Number(row.longitude)
                : undefined,
            googleMapsUrl: row.link?.trim() || undefined,
        };
    }

    async saveJobResults(jobId: string) {
        const rows = await this.downloadJobResults(jobId);

        const businesses = rows
            .map((row: Record<string, string>) =>
                this.mapScraperBusiness(row),
            )
            .filter((business) => business.name);

        const savedBusinesses = [];

        for (const business of businesses) {
            const saved = await this.businessesService.create(business);
            savedBusinesses.push(saved);
        }

        return savedBusinesses;
    }
}