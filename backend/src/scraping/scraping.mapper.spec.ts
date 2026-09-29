import { describe, expect, it } from 'vitest';

/**
 * Mirrors ScrapingService.mapScraperBusiness parsing rules for ratings/coords.
 * Kept as a pure helper test so we do not need Nest DI for the mapper logic.
 */
function mapScraperBusiness(row: Record<string, string>) {
  const ratingRaw = row.review_rating?.trim();
  const reviewCountRaw = row.review_count?.trim();
  const latitudeRaw = row.latitude?.trim();
  const longitudeRaw = row.longitude?.trim();

  const rating =
    ratingRaw !== undefined && ratingRaw !== ''
      ? Number(ratingRaw)
      : undefined;
  const reviewCount =
    reviewCountRaw !== undefined && reviewCountRaw !== ''
      ? Number(reviewCountRaw)
      : undefined;
  const latitude =
    latitudeRaw !== undefined && latitudeRaw !== ''
      ? Number(latitudeRaw)
      : undefined;
  const longitude =
    longitudeRaw !== undefined && longitudeRaw !== ''
      ? Number(longitudeRaw)
      : undefined;

  return {
    name: row.title?.trim(),
    category: row.category?.trim() || undefined,
    address: row.address?.trim() || undefined,
    phone: row.phone?.trim() || undefined,
    website: row.website?.trim() || undefined,
    rating: Number.isFinite(rating) ? rating : undefined,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    googleMapsUrl: row.link?.trim() || undefined,
  };
}

describe('mapScraperBusiness', () => {
  it('maps available fields and leaves missing ones undefined', () => {
    const result = mapScraperBusiness({
      title: '  Pizza Place  ',
      category: 'Restaurant',
      address: '1 Main St',
      phone: '',
      website: 'https://example.com',
      review_rating: '4.5',
      review_count: '12',
      latitude: '36.8',
      longitude: '10.1',
      link: 'https://maps.google.com/?cid=1',
    });

    expect(result).toEqual({
      name: 'Pizza Place',
      category: 'Restaurant',
      address: '1 Main St',
      phone: undefined,
      website: 'https://example.com',
      rating: 4.5,
      reviewCount: 12,
      latitude: 36.8,
      longitude: 10.1,
      googleMapsUrl: 'https://maps.google.com/?cid=1',
    });
  });

  it('distinguishes a missing rating from a zero rating', () => {
    expect(mapScraperBusiness({ title: 'A', review_rating: '' }).rating).toBeUndefined();
    expect(mapScraperBusiness({ title: 'B', review_rating: '0' }).rating).toBe(0);
  });

  it('ignores non-numeric coordinates', () => {
    const result = mapScraperBusiness({
      title: 'C',
      latitude: 'not-a-number',
      longitude: '10',
    });

    expect(result.latitude).toBeUndefined();
    expect(result.longitude).toBe(10);
  });
});
