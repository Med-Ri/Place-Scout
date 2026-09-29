function isSafeHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasValidCoordinates(business) {
  return (
    Number.isFinite(business?.latitude) &&
    Number.isFinite(business?.longitude)
  );
}

export { hasValidCoordinates, isSafeHttpUrl };
