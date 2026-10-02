import type { NextAdapterOptions, NextAdapterProps } from '../src/entries/next';
import type {
  ReactRouterAdapterOptions,
  ReactRouterAdapterProps,
} from '../src/entries/react-router';
import type {
  TanStackRouterAdapterOptions,
  TanStackRouterAdapterProps,
} from '../src/entries/tanstack-router';

import * as next from '../src/entries/next';
import * as reactRouter from '../src/entries/react-router';
import * as tanstackRouter from '../src/entries/tanstack-router';

describe('entry points', () => {
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
