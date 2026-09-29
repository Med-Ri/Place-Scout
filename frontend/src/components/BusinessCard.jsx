import { hasValidCoordinates, isSafeHttpUrl } from '../utils.js';

function formatRating(rating) {
  if (rating === null || rating === undefined) return null;
  if (!Number.isFinite(Number(rating))) return null;
  return Number(rating).toFixed(1);
}

export function BusinessCard({
  business,
  selected = false,
  onSelect,
  note = '',
  onNoteChange,
}) {
  const ratingLabel = formatRating(business.rating);
  const website = isSafeHttpUrl(business.website)
    ? business.website
    : null;
  const mapsUrl = isSafeHttpUrl(business.googleMapsUrl)
    ? business.googleMapsUrl
    : null;
  const id = business._id ?? business.id ?? business.name;
  const noteId = `note-${id}`;

  return (
    <article
      className={`business-card ${selected ? 'is-selected' : ''}`}
      data-business-id={id}
    >
      <button
        type="button"
        className="business-card__hit"
        onClick={() => onSelect?.(business)}
        aria-pressed={selected}
      >
        <div className="business-card__header">
          <h3 className="business-card__name">{business.name}</h3>
          {business.category ? (
            <p className="business-card__category">{business.category}</p>
          ) : null}
        </div>

        {(ratingLabel !== null || business.reviewCount != null) && (
          <p className="business-card__meta">
            {ratingLabel !== null ? (
              <span aria-label={`Rating ${ratingLabel} out of 5`}>
                {ratingLabel}
                <span className="business-card__star" aria-hidden="true">
                  ★
                </span>
              </span>
            ) : null}
            {business.reviewCount != null &&
            Number.isFinite(Number(business.reviewCount)) ? (
              <span>
                {ratingLabel !== null ? ' · ' : ''}
                {Number(business.reviewCount).toLocaleString()} reviews
              </span>
            ) : null}
          </p>
        )}

        {business.address ? (
          <p className="business-card__address">{business.address}</p>
        ) : null}

        {business.phone ? (
          <p className="business-card__phone">
            <a
              href={`tel:${business.phone.replace(/\s+/g, '')}`}
              onClick={(event) => event.stopPropagation()}
            >
              {business.phone}
            </a>
          </p>
        ) : null}

        {!hasValidCoordinates(business) ? (
          <p className="business-card__coords-note">No map coordinates</p>
        ) : null}
      </button>

      <div className="business-card__note-field">
        <label htmlFor={noteId}>Note</label>
        <textarea
          id={noteId}
          rows={2}
          value={note}
          placeholder="Optional note for this business…"
          onChange={(event) => onNoteChange?.(event.target.value)}
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      {(website || mapsUrl) && (
        <div className="business-card__links">
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
            >
              Website
            </a>
          ) : null}
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          ) : null}
        </div>
      )}
    </article>
  );
}
