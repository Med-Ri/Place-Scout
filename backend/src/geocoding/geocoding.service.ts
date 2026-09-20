import { Injectable } from '@nestjs/common';

@Injectable()
export class GeocodingService {
    async getCoordinates(place: string) {
        // Temporary implementation.
        // We'll connect this to a real geocoding provider next.
        if (place.toLowerCase() === 'paris') {
            return {
                lat: 48.8566,
                lon: 2.3522,
            };
        }

        throw new Error(`Coordinates not found for: ${place}`);
    }
}