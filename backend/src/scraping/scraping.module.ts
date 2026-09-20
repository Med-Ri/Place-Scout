import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { GeocodingModule } from '../geocoding/geocoding.module';

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