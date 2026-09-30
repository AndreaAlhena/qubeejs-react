import type { QubeeHandle } from '../src/index';

import * as api from '../src/index';

describe('public API', () => {
  it('should export exactly the documented runtime symbols', () => {
    expect(Object.keys(api).sort()).toEqual(['useQubee']);
  });

  it('should export the documented types', () => {
    expectTypeOf<QubeeHandle>().toHaveProperty('state');
  });
});
