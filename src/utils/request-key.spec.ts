import type { ListRequest } from '@qubeejs/core';

import { buildListRequest, readListState } from '@qubeejs/core';

import { articleList } from '../../test/fixtures/article-list';
import { requestKey } from './request-key';

const requestFor = (search: string): ListRequest =>
  buildListRequest(articleList, readListState(articleList, search));

describe('requestKey', () => {
  it('should be equal for two request objects that ask for the same page', () => {
    expect(requestKey(requestFor('page=2'))).toBe(requestKey(requestFor('page=2')));
  });

  it('should differ when the address differs', () => {
    expect(requestKey(requestFor('page=2'))).not.toBe(requestKey(requestFor('page=3')));
  });

  it('should differ when a header differs', () => {
    const request = requestFor('');

    expect(requestKey({ ...request, headers: { Range: '0-19' } })).not.toBe(
      requestKey({ ...request, headers: { Range: '20-39' } })
    );
  });

  it('should not depend on the order of the headers', () => {
    const request = requestFor('');

    expect(
      requestKey({ ...request, headers: { Prefer: 'count=exact', Range: '0-19', Unit: 'items' } })
    ).toBe(
      requestKey({ ...request, headers: { Unit: 'items', Range: '0-19', Prefer: 'count=exact' } })
    );
  });

  it('should treat no headers and an empty set of headers alike', () => {
    const request = requestFor('');

    expect(requestKey({ ...request, headers: null })).toBe(requestKey({ ...request, headers: {} }));
  });
});
