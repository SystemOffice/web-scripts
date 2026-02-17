import { jest } from '@jest/globals';

// Mock fetch before importing module
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const { loadClientConfig, fetchWithTimeout } = await import('../fetch-config.js');

function createMockWindow(config = null) {
  return {
    CHAT_WIDGET_CONFIG: config,
    location: { hostname: 'test.example.com' }
  };
}

function jsonResponse(body) {
  return { ok: true, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  mockFetch.mockReset();
});

// --- loadClientConfig tests ---

test('test_loadClientConfig_windowConfigExists_returnsWindowConfig', async () => {
  const expected = { zoom: { enabled: true } };
  const windowRef = createMockWindow(expected);

  const result = await loadClientConfig(windowRef, 'https://api.test.com', 5000);

  expect(result).toBe(expected);
  expect(mockFetch).not.toHaveBeenCalled();
});

test('test_loadClientConfig_noWindowConfig_fetchesFromService', async () => {
  const expected = { chatbot: { enabled: true } };
  mockFetch.mockResolvedValue(jsonResponse(expected));
  const windowRef = createMockWindow(null);

  const result = await loadClientConfig(windowRef, 'https://api.test.com', 5000);

  expect(result).toEqual(expected);
  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.test.com/config/test.example.com',
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
});

test('test_loadClientConfig_fetchFails_returnsDefaults', async () => {
  mockFetch.mockRejectedValue(new Error('network error'));
  const windowRef = createMockWindow(null);

  const result = await loadClientConfig(windowRef, 'https://api.test.com', 5000);

  expect(result).toEqual({
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: { enabled: false },
    links: []
  });
});

test('test_loadClientConfig_fetchNotOk_returnsDefaults', async () => {
  mockFetch.mockResolvedValue({ ok: false });
  const windowRef = createMockWindow(null);

  const result = await loadClientConfig(windowRef, 'https://api.test.com', 5000);

  expect(result).toEqual({
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: { enabled: false },
    links: []
  });
});

// --- fetchWithTimeout tests ---

test('test_fetchWithTimeout_successfulResponse_returnsJson', async () => {
  const expected = { data: 'test' };
  mockFetch.mockResolvedValue(jsonResponse(expected));

  const result = await fetchWithTimeout('https://api.test.com/config', 5000);

  expect(result).toEqual(expected);
});

test('test_fetchWithTimeout_timeout_abortsRequest', async () => {
  mockFetch.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted', 'AbortError'));
    });
  }));

  await expect(fetchWithTimeout('https://api.test.com/config', 50))
    .rejects.toThrow('aborted');
});

test('test_fetchWithTimeout_notOkResponse_returnsNull', async () => {
  mockFetch.mockResolvedValue({ ok: false });

  const result = await fetchWithTimeout('https://api.test.com/config', 5000);

  expect(result).toBeNull();
});
