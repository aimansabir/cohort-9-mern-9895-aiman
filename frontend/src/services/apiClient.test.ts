import { ApiError, apiRequest } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function unreadableResponse(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new Error('not json')),
  } as unknown as Response;
}

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

// Reaching into mock.calls without checking would hide a fetch that never
// happened, so this fails the test outright instead.
function lastRequest(): RequestInit {
  const options = fetchMock.mock.calls.at(-1)?.[1];
  if (!options) {
    throw new Error('fetch was never called');
  }
  return options;
}

function lastHeaders(): Record<string, string> {
  return lastRequest().headers as Record<string, string>;
}

describe('apiRequest', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('returns the parsed body on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { note: 'x' } }));
    const result = await apiRequest<{ note: string }>('/api/notes');
    expect(result.data?.note).toBe('x');
  });

  it('sends no content type when there is no body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await apiRequest('/api/notes');

    expect(lastHeaders()['Content-Type']).toBeUndefined();
  });

  it('sends json only when there is a body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await apiRequest('/api/notes', { method: 'POST', body: { title: 'x' } });

    expect(lastHeaders()['Content-Type']).toBe('application/json');
    expect(lastRequest().body).toBe(JSON.stringify({ title: 'x' }));
  });

  it('sends the token as a bearer header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await apiRequest('/api/notes', { token: 'abc123' });

    expect(lastHeaders()['Authorization']).toBe('Bearer abc123');
  });

  it('sends no auth header without a token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await apiRequest('/api/notes', { token: null });

    expect(lastHeaders()['Authorization']).toBeUndefined();
  });

  // Everything that can go wrong arrives at the pages as one kind of error,
  // which is why the pages can rely on err instanceof ApiError.
  describe('turning every failure into an ApiError', () => {
    it('reports a status and the server message', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false, message: 'Note not found' }, 404));

      await expect(apiRequest('/api/notes/1')).rejects.toMatchObject({
        name: 'ApiError',
        status: 404,
        message: 'Note not found',
      });
    });

    it('falls back to a generic message when the server sends none', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false }, 500));

      await expect(apiRequest('/api/notes')).rejects.toMatchObject({
        message: 'Something went wrong',
        status: 500,
      });
    });

    // fetch only rejects when there was no response at all
    it('reports status 0 when the server cannot be reached', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(apiRequest('/api/notes')).rejects.toMatchObject({
        message: 'Could not reach the server',
        status: 0,
      });
    });

    it('complains when a good response is not readable', async () => {
      fetchMock.mockResolvedValue(unreadableResponse(200));

      await expect(apiRequest('/api/notes')).rejects.toMatchObject({
        message: 'The server sent a response we could not read',
      });
    });

    it('is a real Error so it can be thrown and caught normally', async () => {
      // without this the test would pass even if apiRequest stopped throwing,
      // because the catch block would simply never run
      expect.assertions(2);
      fetchMock.mockResolvedValue(jsonResponse({ message: 'nope' }, 400));

      try {
        await apiRequest('/api/notes');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
