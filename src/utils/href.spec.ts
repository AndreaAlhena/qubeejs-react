import { joinHref, normalizeHref, pathnameOfHref, searchOfHref } from './href';

describe('href', () => {
  describe('joinHref', () => {
    it('should join a pathname and a query', () => {
      expect(joinHref('/articles', 'q=react')).toBe('/articles?q=react');
    });

    it('should leave the query out when it is empty', () => {
      expect(joinHref('/articles', '')).toBe('/articles');
    });
  });

  describe('normalizeHref', () => {
    it('should escape commas the way URLSearchParams does', () => {
      expect(normalizeHref('/articles?sort=-publishedAt,title')).toBe(
        '/articles?sort=-publishedAt%2Ctitle'
      );
    });

    it('should spell spaces as +', () => {
      expect(normalizeHref('/articles?q=a%20b')).toBe('/articles?q=a+b');
    });

    it('should drop an empty query', () => {
      expect(normalizeHref('/articles?')).toBe('/articles');
    });
  });

  describe('pathnameOfHref', () => {
    it('should read the pathname before the query', () => {
      expect(pathnameOfHref('/articles?q=react')).toBe('/articles');
    });

    it('should return an href without a query as it is', () => {
      expect(pathnameOfHref('/articles')).toBe('/articles');
    });
  });

  describe('searchOfHref', () => {
    it('should read the query after the first question mark', () => {
      expect(searchOfHref('/articles?q=react&page=2')).toBe('q=react&page=2');
    });

    it('should return an empty query when there is none', () => {
      expect(searchOfHref('/articles')).toBe('');
    });
  });
});
