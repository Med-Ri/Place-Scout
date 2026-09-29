import { BusinessCard } from './BusinessCard.jsx';

export function ResultsList({
  businesses,
  selectedId,
  onSelect,
}) {
  if (!businesses?.length) {
    return (
      <div className="empty-state" role="status">
        <h2>No businesses found</h2>
        <p>
          Try a broader category, a nearby city, or add more location context
          (for example, <em>Tunis, Tunisia</em>).
        </p>
      </div>
    );
  }

  return (
    <div className="results-list">
      <p className="results-count" role="status">
        {businesses.length}{' '}
        {businesses.length === 1 ? 'business' : 'businesses'} found
      </p>
      <ul className="results-list__items">
        {businesses.map((business) => {
          const id = business._id ?? business.id ?? business.name;
          return (
            <li key={id}>
              <BusinessCard
                business={business}
                selected={selectedId === id}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
