import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';

import type { ListRouter, NavigateOptions, QubeeHandle, QubeeProviderProps } from '../src/index';

import * as api from '../src/index';

describe('public API', () => {
  it('should export exactly the documented runtime symbols', () => {
    expect(Object.keys(api).sort()).toEqual([
      'MissingQubeeProviderError',
      'QubeeProvider',
      'useBrowserRouter',
      'useQubee',
      'useQubeeContext',
    ]);
  });

  it('should export the documented types', () => {
    expectTypeOf<ListRouter>().toHaveProperty('navigate');
    expectTypeOf<NavigateOptions>().toHaveProperty('replace');
    expectTypeOf<QubeeHandle>().toHaveProperty('state');
    expectTypeOf<QubeeProviderProps>().toHaveProperty('children');
  });

  it('should accept either a configuration or a value, with children', () => {
    const qubee = createQubee({ driver: STRAPI_DRIVER });
    const accept = (props: QubeeProviderProps): QubeeProviderProps => props;

    expect(accept({ children: null, driver: STRAPI_DRIVER })).toBeDefined();
    expect(accept({ children: null, value: qubee })).toBeDefined();
  });

  it('should reject a configuration together with a value', () => {
    const qubee = createQubee({ driver: STRAPI_DRIVER });
    const accept = (props: QubeeProviderProps): QubeeProviderProps => props;

    // @ts-expect-error — a configuration and a value are exclusive: pass one or the other
    expect(accept({ children: null, driver: STRAPI_DRIVER, value: qubee })).toBeDefined();
  });

  it('should require children', () => {
    const qubee = createQubee({ driver: STRAPI_DRIVER });
    const accept = (props: QubeeProviderProps): QubeeProviderProps => props;

    // @ts-expect-error — children is required on the value branch
    expect(accept({ value: qubee })).toBeDefined();
    // @ts-expect-error — children is required on the configuration branch
    expect(accept({ driver: STRAPI_DRIVER })).toBeDefined();
  });
});
