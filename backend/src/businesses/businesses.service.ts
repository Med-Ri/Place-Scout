import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    Business,
    BusinessDocument,
} from './schemas/business.schema';

@Injectable()
export class BusinessesService {
    constructor(
        @InjectModel(Business.name)
        private readonly businessModel: Model<BusinessDocument>,
    ) { }

    async create(data: Partial<Business>) {
        const business = new this.businessModel(data);

        return business.save();
    }

    async findAll() {
        return this.businessModel.find().sort({ createdAt: -1 }).lean();
    }
}