import { Body, Controller, Get, Post } from '@nestjs/common';

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
    findAll() {
        return this.businessesService.findAll();
    }
}