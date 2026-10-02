import * as reactRouter from '../src/entries/react-router';
import * as tanstackRouter from '../src/entries/tanstack-router';

describe('entry points', () => {
  describe('@qubeejs/react/react-router', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(reactRouter).sort()).toEqual([
        'ReactRouterAdapter',
        'useReactRouterAdapter',
      ]);
    });
  });

  describe('@qubeejs/react/tanstack-router', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(tanstackRouter).sort()).toEqual([
        'TanStackRouterAdapter',
        'useTanStackRouterAdapter',
      ]);
    });
  });
});
