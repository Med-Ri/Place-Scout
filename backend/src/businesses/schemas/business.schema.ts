import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BusinessDocument = HydratedDocument<Business>;

@Schema({
    timestamps: true,
})
export class Business {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    category?: string;

    @Prop({ trim: true })
    address?: string;

    @Prop({ trim: true })
    city?: string;

    @Prop({ trim: true })
    country?: string;

    @Prop({ trim: true })
    phone?: string;

    @Prop({ trim: true })
    website?: string;

    @Prop()
    rating?: number;

    @Prop()
    reviewCount?: number;

    @Prop()
    latitude?: number;

    @Prop()
    longitude?: number;

    @Prop()
    googleMapsUrl?: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);