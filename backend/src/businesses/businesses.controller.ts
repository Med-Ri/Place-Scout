import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BusinessesService } from './businesses.service.js';
import { Business } from './schemas/business.schema.js';

@Controller('businesses')
export class BusinessesController {
    constructor(
        private readonly businessesService: BusinessesService,
    ) { }

    @Post()
    create(@Body() data: Partial<Business>) {
        return this.businessesService.create(data);
    }

    @Get()
    findAll(@Query('searchId') searchId?: string) {
        return this.businessesService.findAll(searchId);
    }
}