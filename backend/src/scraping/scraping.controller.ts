import { Controller, Param, Post, Get } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
    constructor(
        private readonly scrapingService: ScrapingService,
    ) { }

    @Post('test')
    createTestJob() {
        return this.scrapingService.createJob();
    }

    @Get(':jobId')
    getJobStatus(@Param('jobId') jobId: string) {
        return this.scrapingService.getJobStatus(jobId);
    }

    @Get(':jobId/results')
    getJobResults(@Param('jobId') jobId: string) {
        return this.scrapingService.downloadJobResults(jobId);
    }
}