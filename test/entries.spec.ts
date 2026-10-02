import * as reactRouter from '../src/entries/react-router';

describe('entry points', () => {
  describe('@qubeejs/react/react-router', () => {
    it('should export exactly the documented symbols', () => {
      expect(Object.keys(reactRouter).sort()).toEqual([
        'ReactRouterAdapter',
        'useReactRouterAdapter',
      ]);
    });
  });
});
