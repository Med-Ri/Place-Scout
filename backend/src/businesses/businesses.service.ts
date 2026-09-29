import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    Business,
    BusinessDocument,
} from './schemas/business.schema.js';

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

    async createMany(data: Partial<Business>[]) {
        if (data.length === 0) {
            return [] as BusinessDocument[];
        }

        const inserted = await this.businessModel.insertMany(data);
        return inserted as BusinessDocument[];
    }

    async findAll(searchId?: string) {
        const filter = searchId ? { searchId } : {};

        return this.businessModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean();
    }
}