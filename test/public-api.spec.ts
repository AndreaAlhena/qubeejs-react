import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';

import type {
  AdapterNavigateOptions,
  ListSetOptions,
  QubeeHandle,
  QubeeListHandle,
  QubeeProviderProps,
  RouterAdapter,
  SortToggle,
} from '../src/index';

import * as api from '../src/index';

describe('public API', () => {
  it('should export exactly the documented runtime symbols', () => {
    expect(Object.keys(api).sort()).toEqual([
      'MissingQubeeProviderError',
      'QubeeProvider',
      'useBrowserAdapter',
      'useQubee',
      'useQubeeContext',
      'useQubeeList',
    ]);
  });

  it('should export the documented types', () => {
    expectTypeOf<AdapterNavigateOptions>().toHaveProperty('replace');
    expectTypeOf<ListSetOptions>().toHaveProperty('debounce');
    expectTypeOf<QubeeHandle>().toHaveProperty('state');
    expectTypeOf<QubeeListHandle<unknown>>().toHaveProperty('set');
    expectTypeOf<QubeeProviderProps>().toHaveProperty('children');
    expectTypeOf<RouterAdapter>().toHaveProperty('navigate');
    expectTypeOf<SortToggle<unknown>>().toEqualTypeOf<Record<never, never>>();
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
