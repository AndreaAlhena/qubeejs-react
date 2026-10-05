import { isRouterAdapter } from './is-router-adapter';

describe('isRouterAdapter', () => {
  it('should recognise an object with a navigate function', () => {
    expect(isRouterAdapter({ navigate: vi.fn(), pathname: '/', search: '' })).toBe(true);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', '42'],
    ['a number', 42],
    ['an input object', { projectId: '42' }],
    ['an object whose navigate is not a function', { navigate: '/tasks' }],
  ])('should not take %s for an adapter', (_name, value) => {
    expect(isRouterAdapter(value)).toBe(false);
  });
});
