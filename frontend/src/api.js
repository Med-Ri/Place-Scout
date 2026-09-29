const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message,
    { status = null, details = null } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function messageFromBody(body, fallback) {
  if (!body) return fallback;
  if (typeof body.message === 'string') return body.message;
  if (Array.isArray(body.message)) return body.message.join(', ');
  if (typeof body.error === 'string') return body.error;
  return fallback;
}

export async function startSearch({ what, where, signal }) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/scraping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ what, where }),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      'Could not reach the Place Scout API. Check that the backend is running.',
      { details: error },
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : (await response.text()) || null;

  if (!response.ok) {
    throw new ApiError(
      messageFromBody(
        body && typeof body === 'object' ? body : null,
        `Search failed (${response.status})`,
      ),
      { status: response.status, details: body },
    );
  }

  // Prefer the documented object contract; accept a bare array for older responses.
  if (Array.isArray(body)) {
    const searchId = body[0]?.searchId ?? null;
    return {
      searchId,
      count: body.length,
      businesses: body,
    };
  }

  if (!body || typeof body !== 'object') {
    throw new ApiError('Unexpected response from the Place Scout API.', {
      status: response.status,
      details: body,
    });
  }

  return {
    searchId: body.searchId ?? null,
    count: body.count ?? body.businesses?.length ?? 0,
    businesses: body.businesses ?? [],
  };
}

export async function getBusinessesBySearchId(searchId, signal) {
  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/businesses?searchId=${encodeURIComponent(searchId)}`,
      {
        headers: { Accept: 'application/json' },
        signal,
      },
    );
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      'Could not reload results from the Place Scout API.',
      { details: error },
    );
  }

  if (!response.ok) {
    throw new ApiError(`Failed to load businesses (${response.status})`, {
      status: response.status,
    });
  }

  const businesses = await response.json();
  return {
    searchId,
    count: businesses.length,
    businesses,
  };
}

export { API_BASE_URL };
