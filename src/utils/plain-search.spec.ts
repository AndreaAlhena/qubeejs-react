import { parseSearch, stringifySearch } from './plain-search';

describe('parseSearch', () => {
  it('should read every value as the text it is in the URL', () => {
    expect(parseSearch('?q=1.50&page=2&draft=true')).toEqual({
      draft: 'true',
      page: '2',
      q: '1.50',
    });
  });

  it('should keep the spaces and the quotes of a value', () => {
    expect(parseSearch('q=10+&title=%22react+hooks%22')).toEqual({
      q: '10 ',
      title: '"react hooks"',
    });
  });

  it('should read a repeated name as a list', () => {
    expect(parseSearch('tag=a&tag=b&tag=c')).toEqual({ tag: ['a', 'b', 'c'] });
  });

  it('should read an empty query as an empty search', () => {
    expect(parseSearch('')).toEqual({});
    expect(parseSearch('?')).toEqual({});
  });
});

describe('stringifySearch', () => {
  it('should write a list as a repeated name, and leave out what is not set', () => {
    expect(stringifySearch({ page: 2, q: undefined, sort: null, tag: ['a', 'b'] })).toBe(
      '?page=2&tag=a&tag=b'
    );
  });

  it('should write a value that is not text as its JSON', () => {
    expect(stringifySearch({ draft: true, filter: { status: 'draft' }, page: 2 })).toBe(
      '?draft=true&filter=%7B%22status%22%3A%22draft%22%7D&page=2'
    );
  });

  it('should write nothing for an empty search', () => {
    expect(stringifySearch({})).toBe('');
    expect(stringifySearch({ q: undefined })).toBe('');
  });

  it('should write back what parseSearch read', () => {
    const query = '?q=10+&title=%22react+hooks%22&tag=a&tag=b';

    expect(stringifySearch(parseSearch(query))).toBe(query);
  });
});
