import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ScrapingModule } from './scraping/scraping.module.js';
import { BusinessesModule } from './businesses/businesses.module.js';
import { GeocodingModule } from './geocoding/geocoding.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI!),

    BusinessesModule,
    ScrapingModule,
    GeocodingModule,
  ],
})
export class AppModule {}