import type { PaginatedResult } from '@qubeejs/core';

import type { QueryState } from '../types/query-state.type';

import { createQueryState, reduceQueryState } from './query-state';

type Row = { id: number };

const page = (id: number): PaginatedResult<Row> => ({
  data: [{ id }],
  firstPageUrl: null,
  from: null,
  lastPage: null,
  lastPageUrl: null,
  nextPageUrl: null,
  page: 1,
  perPage: null,
  prevPageUrl: null,
  to: null,
  total: null,
});

const EMPTY: QueryState<Row> = { attempt: 0, data: undefined, error: undefined, key: null };

describe('createQueryState', () => {
  it('should start with nothing answered', () => {
    expect(createQueryState<Row>('a', undefined)).toEqual(EMPTY);
  });

  it('should count the first request as answered by the initial data', () => {
    const initial = page(1);

    expect(createQueryState('a', initial)).toEqual({
      attempt: 0,
      data: initial,
      error: undefined,
      key: 'a',
    });
  });

  it('should ignore initial data when there is no request for it to answer', () => {
    expect(createQueryState(null, page(1))).toEqual(EMPTY);
  });
});

describe('reduceQueryState', () => {
  describe('answered', () => {
    it('should hold the page and the request it answers', () => {
      const data = page(1);

      expect(reduceQueryState(EMPTY, { attempt: 0, data, key: 'a', type: 'answered' })).toEqual({
        attempt: 0,
        data,
        error: undefined,
        key: 'a',
      });
    });

    it('should clear the error of the request before', () => {
      const failed: QueryState<Row> = { ...EMPTY, error: new Error('offline'), key: 'a' };
      const next = reduceQueryState(failed, {
        attempt: 1,
        data: page(2),
        key: 'a',
        type: 'answered',
      });

      expect(next.error).toBeUndefined();
      expect(next.attempt).toBe(1);
    });
  });

  describe('started', () => {
    it('should set the answer aside when a fetch for another request starts, keeping its page', () => {
      const data = page(1);
      const answered: QueryState<Row> = { attempt: 2, data, error: undefined, key: 'a' };

      expect(reduceQueryState(answered, { key: 'b', type: 'started' })).toEqual({
        attempt: 2,
        data,
        error: undefined,
        key: null,
      });
    });

    it('should drop the error of the request it replaces', () => {
      const failed: QueryState<Row> = { ...EMPTY, error: new Error('offline'), key: 'a' };

      expect(reduceQueryState(failed, { key: 'b', type: 'started' })).toEqual(EMPTY);
    });

    it('should return the same state when the request is the one the answer belongs to', () => {
      const answered: QueryState<Row> = { ...EMPTY, data: page(1), key: 'a' };

      expect(reduceQueryState(answered, { key: 'a', type: 'started' })).toBe(answered);
    });

    it('should return the same state when no answer is held', () => {
      expect(reduceQueryState(EMPTY, { key: 'a', type: 'started' })).toBe(EMPTY);
    });
  });

  describe('failed', () => {
    it('should discard the page of another request', () => {
      const answered: QueryState<Row> = { ...EMPTY, data: page(1), key: 'a' };
      const error = new Error('offline');

      expect(reduceQueryState(answered, { attempt: 0, error, key: 'b', type: 'failed' })).toEqual({
        attempt: 0,
        data: undefined,
        error,
        key: 'b',
      });
    });

    it('should keep the page when the request it answers fails on a refetch', () => {
      const data = page(1);
      const answered: QueryState<Row> = { ...EMPTY, data, key: 'a' };
      const error = new Error('offline');

      expect(reduceQueryState(answered, { attempt: 1, error, key: 'a', type: 'failed' })).toEqual({
        attempt: 1,
        data,
        error,
        key: 'a',
      });
    });
  });

  describe('cleared', () => {
    it('should forget the last answer', () => {
      const answered: QueryState<Row> = { attempt: 2, data: page(1), error: undefined, key: 'a' };

      expect(reduceQueryState(answered, { type: 'cleared' })).toEqual({ ...EMPTY, attempt: 2 });
    });

    it('should forget a page that was only kept as the previous one', () => {
      const superseded: QueryState<Row> = { ...EMPTY, data: page(1) };

      expect(reduceQueryState(superseded, { type: 'cleared' })).toEqual(EMPTY);
    });

    it('should return the same state when there is nothing to forget', () => {
      expect(reduceQueryState(EMPTY, { type: 'cleared' })).toBe(EMPTY);
    });
  });
});
