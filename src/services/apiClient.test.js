import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockInstance),
  },
}));

const loadApiClient = async () => {
  vi.resetModules();
  return import('./apiClient');
};

describe('apiClient', () => {
  beforeEach(() => {
    Object.values(mockInstance).forEach((fn) => fn.mockReset());
  });

  it('API-1: defaults baseURL to http://localhost:3001/api when VITE_API_URL is unset', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const axios = (await import('axios')).default;
    await loadApiClient();

    expect(axios.create).toHaveBeenCalled();
    const config = axios.create.mock.calls.at(-1)[0];
    expect(config.baseURL).toBe('http://localhost:3001/api');
    expect(config.timeout).toBe(30000);
    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('API-2: respects VITE_API_URL when provided', async () => {
    vi.stubEnv('VITE_API_URL', 'https://example.test/api');
    const axios = (await import('axios')).default;
    await loadApiClient();

    const config = axios.create.mock.calls.at(-1)[0];
    expect(config.baseURL).toBe('https://example.test/api');
  });

  it('API-3: get/post/put/delete delegate to the axios instance and unwrap response.data', async () => {
    mockInstance.get.mockResolvedValue({ data: { ok: 'g' } });
    mockInstance.post.mockResolvedValue({ data: { ok: 'p' } });
    mockInstance.put.mockResolvedValue({ data: { ok: 'u' } });
    mockInstance.delete.mockResolvedValue({ data: { ok: 'd' } });

    const { apiClient } = await loadApiClient();

    await expect(apiClient.get('/x')).resolves.toEqual({ ok: 'g' });
    await expect(apiClient.post('/x', { a: 1 })).resolves.toEqual({ ok: 'p' });
    await expect(apiClient.put('/x', { a: 1 })).resolves.toEqual({ ok: 'u' });
    await expect(apiClient.delete('/x')).resolves.toEqual({ ok: 'd' });

    expect(mockInstance.get).toHaveBeenCalledWith('/x', {});
    expect(mockInstance.post).toHaveBeenCalledWith('/x', { a: 1 }, {});
    expect(mockInstance.put).toHaveBeenCalledWith('/x', { a: 1 }, {});
    expect(mockInstance.delete).toHaveBeenCalledWith('/x', {});
  });

  it('exposes the underlying axios instance via getAxiosInstance', async () => {
    const { apiClient } = await loadApiClient();
    expect(apiClient.getAxiosInstance()).toBe(mockInstance);
  });
});
