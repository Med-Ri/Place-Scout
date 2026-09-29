const CSV_COLUMNS = [
  { header: 'name', getValue: (b) => b.name ?? '' },
  { header: 'phone number', getValue: (b) => b.phone ?? '' },
  { header: 'rate', getValue: (b) => (b.rating == null ? '' : b.rating) },
  { header: 'website', getValue: (b) => b.website ?? '' },
  { header: 'address', getValue: (b) => b.address ?? '' },
  { header: 'note', getValue: (b) => b.note ?? '' },
];

function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function businessesToCsv(businesses, notesById = {}) {
  const header = CSV_COLUMNS.map((column) => column.header).join(',');
  const rows = (businesses || []).map((business) => {
    const id = business._id ?? business.id ?? business.name;
    const withNote = {
      ...business,
      note: notesById[id] ?? business.note ?? '',
    };
    return CSV_COLUMNS.map((column) =>
      escapeCsvValue(column.getValue(withNote)),
    ).join(',');
  });
  return [header, ...rows].join('\n');
}

function slugPart(value) {
  return (
    String(value || 'search')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'search'
  );
}

export function buildExportFilename({ what, where, searchId, extension = 'csv' }) {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = [slugPart(what), slugPart(where), searchId?.slice(0, 8), stamp]
    .filter(Boolean)
    .join('_');
  return `place-scout_${base}.${extension}`;
}

function csvBlob(csv) {
  return new Blob([`\uFEFF${csv}\n`], { type: 'text/csv;charset=utf-8' });
}

function triggerAnchorDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function canSaveToFolder() {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
}

/**
 * Opens the system save dialog so the user can pick Downloads, a local folder,
 * or a connected cloud folder (Google Drive / Dropbox / OneDrive desktop sync).
 * Falls back to a normal browser download when the File System Access API is unavailable.
 */
export async function saveBusinessesCsv(businesses, meta = {}, notesById = {}) {
  const csv = businessesToCsv(businesses, notesById);
  const filename = buildExportFilename({ ...meta, extension: 'csv' });
  const blob = csvBlob(csv);

  if (!canSaveToFolder()) {
    triggerAnchorDownload(filename, blob);
    return { method: 'download' };
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'CSV spreadsheet',
          accept: { 'text/csv': ['.csv'] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return { method: 'folder', name: handle.name };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { method: 'cancelled' };
    }
    // Permission / unsupported path — still get the file to the user.
    triggerAnchorDownload(filename, blob);
    return { method: 'download' };
  }
}

export function downloadBusinessesCsv(businesses, meta = {}, notesById = {}) {
  const csv = businessesToCsv(businesses, notesById);
  const filename = buildExportFilename({ ...meta, extension: 'csv' });
  triggerAnchorDownload(filename, csvBlob(csv));
  return { method: 'download' };
}
