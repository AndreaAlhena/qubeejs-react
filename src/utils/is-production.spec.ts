import { isProduction } from './is-production';

describe('isProduction', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('should be true when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(isProduction()).toBe(true);
  });

  it('should be false for any other NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(isProduction()).toBe(false);
  });

  it('should be false where there is no process, as in a browser without a bundler', () => {
    vi.stubGlobal('process', undefined);

    expect(isProduction()).toBe(false);
  });
});
