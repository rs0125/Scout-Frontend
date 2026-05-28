import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseError,
  ERROR_TYPES,
  handleOperationError,
  handleUploadError,
  showSuccessMessage,
  clearErrors,
  withRetry,
} from './errorHandler';

const getToastTexts = () =>
  Array.from(document.querySelectorAll('.toast')).map((t) => t.textContent);

describe('errorHandler.parseError', () => {
  it('ERR-1: 400 with data.error becomes a validation error', () => {
    const info = parseError({ response: { status: 400, data: { error: 'Bad' } } });
    expect(info.type).toBe(ERROR_TYPES.VALIDATION);
    expect(info.message).toBe('Bad');
    expect(info.statusCode).toBe(400);
    expect(info.issues).toEqual([]);
  });

  it('ERR-2: 400 with nested details.issues surfaces issues array', () => {
    const info = parseError({
      response: {
        status: 400,
        data: {
          details: { issues: [{ path: ['city'], message: 'required' }] },
        },
      },
    });
    expect(info.issues).toHaveLength(1);
    expect(info.issues[0].path).toEqual(['city']);
    expect(info.issues[0].message).toBe('required');
  });

  it('ERR-2b: 400 with top-level issues array also surfaces issues', () => {
    const info = parseError({
      response: {
        status: 400,
        data: { issues: [{ path: ['x'], message: 'm' }] },
      },
    });
    expect(info.issues).toHaveLength(1);
  });

  it('ERR-3: 401 yields the Employee ID hint when no message provided', () => {
    const info = parseError({ response: { status: 401, data: {} } });
    expect(info.message).toMatch(/Employee ID/i);
  });

  it('ERR-4: 403 mentions revoked scout access when no message provided', () => {
    const info = parseError({ response: { status: 403, data: {} } });
    expect(info.message).toMatch(/scout access/i);
  });

  it('ERR-5: 404 maps to NOT_FOUND', () => {
    const info = parseError({ response: { status: 404, data: {} } });
    expect(info.type).toBe(ERROR_TYPES.NOT_FOUND);
    expect(info.message).toBe('Warehouse not found');
  });

  it('ERR-6: 500 maps to SERVER', () => {
    const info = parseError({ response: { status: 500, data: {} } });
    expect(info.type).toBe(ERROR_TYPES.SERVER);
  });

  it('ERR-7: unknown status falls back to data.error or generic template', () => {
    const info = parseError({
      response: { status: 418, data: { error: 'Teapot' } },
    });
    expect(info.message).toBe('Teapot');
    expect(info.statusCode).toBe(418);
  });

  it('ERR-8: request without response is a network error', () => {
    const info = parseError({ request: {} });
    expect(info.type).toBe(ERROR_TYPES.NETWORK);
    expect(info.message).toMatch(/connection/i);
  });

  it('ERR-9: plain message is a generic configuration error', () => {
    const info = parseError({ message: 'foo' });
    expect(info.type).toBe(ERROR_TYPES.GENERIC);
    expect(info.message).toBe('foo');
  });
});

describe('errorHandler — toast helpers', () => {
  beforeEach(() => {
    clearErrors();
  });

  it('ERR-10: handleUploadError translates 413 to a friendly message and prefixes filename', () => {
    handleUploadError(
      { response: { status: 413, data: {} } },
      'photo.jpg'
    );
    const texts = getToastTexts();
    expect(texts.length).toBeGreaterThan(0);
    expect(texts[0]).toMatch(/Failed to upload photo\.jpg/);
    expect(texts[0]).toMatch(/File too large/i);
  });

  it('ERR-11: handleOperationError uses a notification with title for validation errors', () => {
    handleOperationError(
      {
        response: {
          status: 400,
          data: {
            error: 'invalid',
            details: { issues: [{ path: ['city'], message: 'required' }] },
          },
        },
      },
      'create'
    );
    const texts = getToastTexts();
    expect(texts[0]).toMatch(/Failed to create warehouse/);
  });

  it('ERR-11b: non-validation operation errors use the short prefixed toast', () => {
    handleOperationError({ response: { status: 500, data: {} } }, 'create');
    const texts = getToastTexts();
    expect(texts[0]).toMatch(/^Failed to create warehouse:/);
  });

  it('ERR-12: clearErrors empties the toast container', () => {
    showSuccessMessage('create');
    expect(getToastTexts().length).toBe(1);
    clearErrors();
    expect(getToastTexts().length).toBe(0);
  });
});

describe('errorHandler.withRetry', () => {
  it('ERR-13: retries until the operation succeeds', async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const op = vi.fn(async () => {
      attempts += 1;
      if (attempts < 2) {
        const err = new Error('boom');
        err.request = {};
        throw err;
      }
      return 'ok';
    });

    const promise = withRetry(op, { maxRetries: 2, delay: 10 });
    // First call fails synchronously; advance timers for backoff before retry
    await vi.advanceTimersByTimeAsync(20);
    await expect(promise).resolves.toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('ERR-14: validation errors are NOT retried', async () => {
    const err = { response: { status: 400, data: { error: 'bad' } } };
    const op = vi.fn().mockRejectedValue(err);

    await expect(
      withRetry(op, { maxRetries: 3, delay: 1 })
    ).rejects.toBe(err);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('ERR-15: exhausting retries calls onError and re-throws', async () => {
    vi.useFakeTimers();
    const err = new Error('net');
    err.request = {};
    const op = vi.fn().mockRejectedValue(err);
    const onError = vi.fn();

    const promise = withRetry(op, {
      maxRetries: 2,
      delay: 5,
      onError,
      operationType: 'create',
    }).catch((e) => e);

    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toBe(err);
    expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(onError).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
