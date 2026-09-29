import {
    BadGatewayException,
    GatewayTimeoutException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { parse } from 'csv-parse/sync';
import { BusinessesService } from '../businesses/businesses.service.js';
import { GeocodingService } from '../geocoding/geocoding.service.js';
import { Business } from '../businesses/schemas/business.schema.js';

export type ScrapingSearchResponse = {
    searchId: string;
    count: number;
    businesses: Array<Business | Record<string, unknown>>;
};

@Injectable()
export class ScrapingService {
    private readonly logger = new Logger(ScrapingService.name);
    private readonly scraperBaseUrl: string;
    private readonly pollIntervalMs: number;
    private readonly pollTimeoutMs: number;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly businessesService: BusinessesService,
        private readonly geocodingService: GeocodingService,
    ) {
        this.scraperBaseUrl =
            this.configService.get<string>('SCRAPER_BASE_URL') ?? '';
        this.pollIntervalMs = Number(
            this.configService.get<string>('SCRAPER_POLL_INTERVAL_MS') ??
                '2000',
        );
        this.pollTimeoutMs = Number(
            this.configService.get<string>('SCRAPER_POLL_TIMEOUT_MS') ??
                '120000',
        );
    }

    async createJob(what: string, where: string) {
        const coordinates = await this.geocodingService.getCoordinates(where);

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.scraperBaseUrl}/api/v1/jobs`, {
                    name: `${what} in ${where}`,
                    keywords: [what],
                    lang: 'en',
                    zoom: 14,
                    lat: String(coordinates.lat),
                    lon: String(coordinates.lon),
                    fast_mode: true,
                    radius: 5000,
                    depth: 1,
                    email: false,
                    max_time: 60,
                    proxies: [],
                }),
            );

            return response.data;
        } catch (error) {
            throw this.toScraperException(error, 'Failed to create scraper job');
        }
    }

    async createAndSaveJob(
        what: string,
        where: string,
    ): Promise<ScrapingSearchResponse> {
        const job = await this.createJob(what, where);
        const jobId = job.id as string;

        await this.waitForJobCompletion(jobId);

        return this.saveJobResults(jobId);
    }

    async getJobStatus(jobId: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.scraperBaseUrl}/api/v1/jobs/${jobId}`,
                ),
            );

            return response.data;
        } catch (error) {
            throw this.toScraperException(
                error,
                `Failed to get status for job ${jobId}`,
            );
        }
    }

    async downloadJobResults(jobId: string) {
        try {
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
        } catch (error) {
            throw this.toScraperException(
                error,
                `Failed to download results for job ${jobId}`,
            );
        }
    }

    private mapScraperBusiness(row: Record<string, string>) {
        const ratingRaw = row.review_rating?.trim();
        const reviewCountRaw = row.review_count?.trim();
        const latitudeRaw = row.latitude?.trim();
        const longitudeRaw = row.longitude?.trim();

        const rating =
            ratingRaw !== undefined && ratingRaw !== ''
                ? Number(ratingRaw)
                : undefined;
        const reviewCount =
            reviewCountRaw !== undefined && reviewCountRaw !== ''
                ? Number(reviewCountRaw)
                : undefined;
        const latitude =
            latitudeRaw !== undefined && latitudeRaw !== ''
                ? Number(latitudeRaw)
                : undefined;
        const longitude =
            longitudeRaw !== undefined && longitudeRaw !== ''
                ? Number(longitudeRaw)
                : undefined;

        return {
            name: row.title?.trim(),
            category: row.category?.trim() || undefined,
            address: row.address?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            website: row.website?.trim() || undefined,
            rating: Number.isFinite(rating) ? rating : undefined,
            reviewCount: Number.isFinite(reviewCount)
                ? reviewCount
                : undefined,
            latitude: Number.isFinite(latitude) ? latitude : undefined,
            longitude: Number.isFinite(longitude) ? longitude : undefined,
            googleMapsUrl: row.link?.trim() || undefined,
        };
    }

    /**
     * Idempotent for a given scraper job: if businesses for this searchId
     * already exist, return them instead of inserting again. Trade-off: a
     * client retry of POST /scraping/:jobId/save will not refresh rows if the
     * CSV somehow changed (scraper jobs are immutable once status is ok).
     * Double-submit of POST /scraping still creates a new job each time; the
     * frontend disables submit while a search is in progress to mitigate that.
     */
    async saveJobResults(jobId: string): Promise<ScrapingSearchResponse> {
        const existing = await this.businessesService.findAll(jobId);

        if (existing.length > 0) {
            this.logger.log(
                `Returning ${existing.length} existing businesses for searchId=${jobId}`,
            );

            return {
                searchId: jobId,
                count: existing.length,
                businesses: existing as Business[],
            };
        }

        const rows = await this.downloadJobResults(jobId);

        const businesses = rows
            .map((row: Record<string, string>) =>
                this.mapScraperBusiness(row),
            )
            .filter((business) => business.name);

        const savedBusinesses = await this.businessesService.createMany(
            businesses.map((business) => ({
                ...business,
                searchId: jobId,
            })),
        );

        return {
            searchId: jobId,
            count: savedBusinesses.length,
            businesses: savedBusinesses,
        };
    }

    private async waitForJobCompletion(jobId: string): Promise<void> {
        const deadline = Date.now() + this.pollTimeoutMs;
        let status = await this.getJobStatus(jobId);

        while (status.Status !== 'ok') {
            if (status.Status === 'failed') {
                throw new BadGatewayException(
                    `Scraper job ${jobId} failed before producing results`,
                );
            }

            if (Date.now() >= deadline) {
                throw new GatewayTimeoutException(
                    `Timed out waiting for scraper job ${jobId} after ${this.pollTimeoutMs}ms (last status: ${status.Status ?? 'unknown'})`,
                );
            }

            await new Promise((resolve) =>
                setTimeout(resolve, this.pollIntervalMs),
            );

            status = await this.getJobStatus(jobId);
        }
    }

    private toScraperException(error: unknown, message: string) {
        if (error instanceof AxiosError) {
            const status = error.response?.status;
            this.logger.error(
                `${message}: scraper HTTP ${status ?? 'error'} (${error.code ?? 'no-code'})`,
            );

            if (!error.response) {
                return new ServiceUnavailableException(
                    `${message}. Is the scraper running at ${this.scraperBaseUrl}?`,
                );
            }

            return new BadGatewayException(
                `${message} (scraper responded with ${status})`,
            );
        }

        this.logger.error(`${message}: unexpected error`);
        return error;
    }
}
