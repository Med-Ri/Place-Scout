import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BusinessesController } from './businesses.controller.js';
import { BusinessesService } from './businesses.service.js';
import { Business, BusinessSchema } from './schemas/business.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Business.name,
        schema: BusinessSchema,
      },
    ]),
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}