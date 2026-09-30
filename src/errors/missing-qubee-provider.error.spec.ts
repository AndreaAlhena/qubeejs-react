import { MissingQubeeProviderError } from './missing-qubee-provider.error';

describe('MissingQubeeProviderError', () => {
  describe('constructor', () => {
    it('should be an Error named after its class', () => {
      const error = new MissingQubeeProviderError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MissingQubeeProviderError);
      expect(error.name).toBe('MissingQubeeProviderError');
    });

    it('should name both ways out in its message', () => {
      expect(new MissingQubeeProviderError().message).toBe(
        'useQubeeContext() was called outside a <QubeeProvider>. Wrap the component in a provider, or call useQubee() for an instance of its own.'
      );
    });
  });
});
