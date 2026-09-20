import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ScrapingController } from './scraping.controller.js';
import { ScrapingService } from './scraping.service.js';
import { BusinessesModule } from '../businesses/businesses.module.js';
import { GeocodingModule } from '../geocoding/geocoding.module.js';

@Module({
  imports: [
    HttpModule,
    BusinessesModule,
    GeocodingModule,
  ],
  controllers: [ScrapingController],
  providers: [ScrapingService],
})
export class ScrapingModule {}