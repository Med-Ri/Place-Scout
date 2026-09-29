import { BusinessCard } from './BusinessCard.jsx';
import { canSaveToFolder } from '../download.js';

export function ResultsList({
  businesses,
  selectedId,
  onSelect,
  notesById = {},
  onNoteChange,
  onDownloadCsv,
  onSaveToFolder,
  exportStatus = null,
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

  const folderSupported = canSaveToFolder();

  return (
    <div className="results-list">
      <div className="results-list__header">
        <p className="results-count" role="status">
          {businesses.length}{' '}
          {businesses.length === 1 ? 'business' : 'businesses'} found
        </p>
        <div className="results-list__downloads">
          <button type="button" className="download-btn" onClick={onDownloadCsv}>
            Download CSV
          </button>
          <button
            type="button"
            className="download-btn download-btn--primary"
            onClick={onSaveToFolder}
            title={
              folderSupported
                ? 'Save into Downloads, Google Drive, Dropbox, or OneDrive folders on this computer'
                : 'Opens a normal download (folder picker is not supported in this browser)'
            }
          >
            {folderSupported ? 'Save to Drive / folder…' : 'Save CSV'}
          </button>
        </div>
      </div>

      {exportStatus ? (
        <p className="export-status" role="status">
          {exportStatus}
        </p>
      ) : null}

      <p className="export-hint">
        CSV columns: name, phone number, rate, website, address, note
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
                note={notesById[id] ?? ''}
                onNoteChange={(value) => onNoteChange?.(id, value)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
