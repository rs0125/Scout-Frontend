import { describe, it, expect } from 'vitest';
import { getMediaFromWarehouse } from './mediaUtils';

describe('mediaUtils.getMediaFromWarehouse', () => {
  it('MED-1: returns the warehouse.media object as-is when present', () => {
    const media = { images: ['a', 'b'], videos: [], docs: ['x'] };
    expect(getMediaFromWarehouse({ media })).toBe(media);
  });

  it('MED-2: parses legacy CSV photos when media is null', () => {
    const result = getMediaFromWarehouse({
      media: null,
      photos: 'http://a, http://b',
    });
    expect(result).toEqual({
      images: ['http://a', 'http://b'],
      videos: [],
      docs: [],
    });
  });

  it('MED-3: empty photos string returns empty media', () => {
    expect(getMediaFromWarehouse({ photos: '' })).toEqual({
      images: [],
      videos: [],
      docs: [],
    });
  });

  it('MED-4: null photos returns empty media', () => {
    expect(getMediaFromWarehouse({ photos: null })).toEqual({
      images: [],
      videos: [],
      docs: [],
    });
  });

  it('MED-5: trims whitespace and drops empty CSV segments', () => {
    const result = getMediaFromWarehouse({
      photos: ' http://a ,  ,http://b,',
    });
    expect(result.images).toEqual(['http://a', 'http://b']);
  });

  it('MED-extra: media takes precedence over photos when both exist', () => {
    const result = getMediaFromWarehouse({
      media: { images: ['x'], videos: [], docs: [] },
      photos: 'http://a,http://b',
    });
    expect(result.images).toEqual(['x']);
  });
});
