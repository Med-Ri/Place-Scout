import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeocodingService {
    constructor(
        private readonly httpService: HttpService,
    ) { }

    async getCoordinates(place: string) {
        const response = await firstValueFrom(
            this.httpService.get(
                'https://nominatim.openstreetmap.org/search',
                {
                    params: {
                        q: place,
                        format: 'json',
                        limit: 1,
                        addressdetails: 1,
                    },
                    headers: {
                        'User-Agent': 'PlaceScout/1.0',
                    },
                },
            ),
        );

        const result = response.data?.[0];

        if (!result) {
            throw new NotFoundException(
                `Location not found: ${place}`,
            );
        }

        return {
            lat: Number(result.lat),
            lon: Number(result.lon),
        };
    }
}