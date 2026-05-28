import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock apiClient module so we can capture URLs without hitting the network.
vi.mock('./apiClient.js', () => {
  const mockAxiosInstance = { delete: vi.fn() };
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getAxiosInstance: vi.fn(() => mockAxiosInstance),
    },
    __mockAxiosInstance: mockAxiosInstance,
  };
});

// axios is used directly inside uploadFileToR2 — mock the default export.
vi.mock('axios', () => ({
  default: {
    put: vi.fn(),
  },
}));

import { warehouseService } from './warehouseService';
import { apiClient, __mockAxiosInstance } from './apiClient.js';
import axios from 'axios';

beforeEach(() => {
  Object.values(apiClient).forEach((fn) => {
    if (typeof fn?.mockReset === 'function') fn.mockReset();
  });
  apiClient.getAxiosInstance.mockReturnValue(__mockAxiosInstance);
  __mockAxiosInstance.delete.mockReset();
  axios.put.mockReset();
});

describe('warehouseService — endpoint mapping', () => {
  it('API-4: create POSTs to /warehouses/scout', async () => {
    apiClient.post.mockResolvedValue({ id: 42 });
    const result = await warehouseService.create({ x: 1 });
    expect(apiClient.post).toHaveBeenCalledWith('/warehouses/scout', { x: 1 });
    expect(result).toEqual({ id: 42 });
  });

  it('getAll GETs /warehouses', async () => {
    apiClient.get.mockResolvedValue([]);
    await warehouseService.getAll();
    expect(apiClient.get).toHaveBeenCalledWith('/warehouses');
  });

  it('update PUTs /warehouses/:id', async () => {
    apiClient.put.mockResolvedValue({});
    await warehouseService.update(7, { foo: 'bar' });
    expect(apiClient.put).toHaveBeenCalledWith('/warehouses/7', { foo: 'bar' });
  });

  it('delete uses the raw axios instance against /warehouses/:id', async () => {
    __mockAxiosInstance.delete.mockResolvedValue({ status: 204 });
    const res = await warehouseService.delete(9);
    expect(__mockAxiosInstance.delete).toHaveBeenCalledWith('/warehouses/9');
    expect(res.status).toBe(204);
  });

  it('getContactNumber GETs /warehouses/:id/contact-number', async () => {
    apiClient.get.mockResolvedValue({ contactNumber: '0000' });
    await warehouseService.getContactNumber(3);
    expect(apiClient.get).toHaveBeenCalledWith('/warehouses/3/contact-number');
  });

  it('API-5: getPresignedUrl POSTs /warehouses/scout/presigned-url with contentType + uploadedBy', async () => {
    apiClient.post.mockResolvedValue({
      uploadUrl: 'https://r2/u',
      imageUrl: 'https://r2/i',
    });
    await warehouseService.getPresignedUrl('image/jpeg', 'VBHIWH');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/warehouses/scout/presigned-url',
      { contentType: 'image/jpeg', uploadedBy: 'VBHIWH' }
    );
  });

  it('getPresignedUrl defaults uploadedBy to empty string when omitted', async () => {
    apiClient.post.mockResolvedValue({});
    await warehouseService.getPresignedUrl('image/jpeg');
    expect(apiClient.post.mock.calls[0][1]).toEqual({
      contentType: 'image/jpeg',
      uploadedBy: '',
    });
  });
});

describe('warehouseService.uploadFileToR2', () => {
  const file = new File(['hi'], 'a.jpg', { type: 'image/jpeg' });

  it('API-6: PUTs to the presigned URL with the file MIME', async () => {
    axios.put.mockResolvedValue({ status: 200 });
    await warehouseService.uploadFileToR2('https://r2/u', file);
    expect(axios.put).toHaveBeenCalledTimes(1);
    const [url, body, config] = axios.put.mock.calls[0];
    expect(url).toBe('https://r2/u');
    expect(body).toBe(file);
    expect(config.headers['Content-Type']).toBe('image/jpeg');
    expect(typeof config.transformRequest[0]).toBe('function');
    expect(config.transformRequest[0]('raw-data')).toBe('raw-data');
  });

  it('API-7: 403 → "Upload forbidden - invalid or expired presigned URL"', async () => {
    axios.put.mockRejectedValue({ response: { status: 403 } });
    await expect(
      warehouseService.uploadFileToR2('u', file)
    ).rejects.toMatchObject({ message: /Upload forbidden/ });
  });

  it('API-8: 413 → "File too large for upload"', async () => {
    axios.put.mockRejectedValue({ response: { status: 413 } });
    await expect(
      warehouseService.uploadFileToR2('u', file)
    ).rejects.toMatchObject({ message: /File too large/ });
  });

  it('API-9: no-response (request) error → "Network error during file upload"', async () => {
    axios.put.mockRejectedValue({ request: {} });
    await expect(
      warehouseService.uploadFileToR2('u', file)
    ).rejects.toMatchObject({ message: /Network error/i });
  });

  it('API-10: unknown status → "File upload failed"', async () => {
    axios.put.mockRejectedValue({ response: { status: 500 } });
    await expect(
      warehouseService.uploadFileToR2('u', file)
    ).rejects.toMatchObject({ message: /File upload failed/ });
  });

  it('configuration error (no request, no response) → "File upload configuration error"', async () => {
    axios.put.mockRejectedValue({ message: 'cfg' });
    await expect(
      warehouseService.uploadFileToR2('u', file)
    ).rejects.toMatchObject({ message: /configuration error/i });
  });
});
