import type { QubeeFetcher } from '../src/entries/fetch';
import type { NextAdapterOptions, NextAdapterProps } from '../src/entries/next';
import type {
  ReactRouterAdapterOptions,
  ReactRouterAdapterProps,
} from '../src/entries/react-router';
import type { QubeeQueryKey } from '../src/entries/tanstack-query';
import type {
  TanStackRouterAdapterOptions,
  TanStackRouterAdapterProps,
} from '../src/entries/tanstack-router';

import * as fetchEntry from '../src/entries/fetch';
import * as next from '../src/entries/next';
import * as reactRouter from '../src/entries/react-router';
import * as tanstackQuery from '../src/entries/tanstack-query';
import * as tanstackRouter from '../src/entries/tanstack-router';
import * as main from '../src/index';

describe('entry points', () => {
  describe('@qubeejs/react/fetch', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(fetchEntry).sort()).toEqual(['QubeeFetchError', 'fetchQubeePage']);
    });

    it('should export the documented types', () => {
      expectTypeOf<QubeeFetcher>().returns.toEqualTypeOf<Promise<Response>>();
    });

    it('should export the error class the main entry exports', () => {
      expect(fetchEntry.QubeeFetchError).toBe(main.QubeeFetchError);
    });
  });

  describe('@qubeejs/react/next', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(next).sort()).toEqual(['NextAdapter', 'useNextAdapter']);
    });

    it('should export the documented types', () => {
      expectTypeOf<NextAdapterOptions>().toHaveProperty('scroll');
      expectTypeOf<NextAdapterProps>().toHaveProperty('children');
    });
  });

  describe('@qubeejs/react/react-router', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(reactRouter).sort()).toEqual([
        'ReactRouterAdapter',
        'useReactRouterAdapter',
      ]);
    });

    it('should export the documented types', () => {
      expectTypeOf<ReactRouterAdapterOptions>().toHaveProperty('scroll');
      expectTypeOf<ReactRouterAdapterProps>().toHaveProperty('children');
    });
  });

  describe('@qubeejs/react/tanstack-query', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(tanstackQuery).sort()).toEqual(['qubeeQueryOptions']);
    });

    it('should export the documented types', () => {
      expectTypeOf<QubeeQueryKey[0]>().toEqualTypeOf<'qubee'>();
    });
  });

  describe('@qubeejs/react/tanstack-router', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(tanstackRouter).sort()).toEqual([
        'TanStackRouterAdapter',
        'useTanStackRouterAdapter',
      ]);
    });

    it('should export the documented types', () => {
      expectTypeOf<TanStackRouterAdapterOptions>().toHaveProperty('scroll');
      expectTypeOf<TanStackRouterAdapterProps>().toHaveProperty('children');
    });
  });
});
