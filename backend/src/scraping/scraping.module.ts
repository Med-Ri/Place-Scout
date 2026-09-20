import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';

@Module({
  imports: [HttpModule],
  controllers: [ScrapingController],
  providers: [ScrapingService],
})
export class ScrapingModule {}