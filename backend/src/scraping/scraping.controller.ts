import { Controller, Param, Post, Get, Body } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { CreateScrapingDto } from './dto/create-scraping.dto';


@Controller('scraping')
export class ScrapingController {
    constructor(
        private readonly scrapingService: ScrapingService,
    ) { }

    @Post('test')
    createTestJob(@Body() dto: CreateScrapingDto) {
        return {
            what: dto.what,
            where: dto.where,
        };
    }

    @Get(':jobId')
    getJobStatus(@Param('jobId') jobId: string) {
        return this.scrapingService.getJobStatus(jobId);
    }

    @Get(':jobId/results')
    getJobResults(@Param('jobId') jobId: string) {
        return this.scrapingService.downloadJobResults(jobId);
    }

    @Post(':jobId/save')
    saveJobResults(@Param('jobId') jobId: string) {
        return this.scrapingService.saveJobResults(jobId);
    }
}