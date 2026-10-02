import { MissingRouterAdapterError } from './missing-router-adapter.error';

describe('MissingRouterAdapterError', () => {
  it('should be an Error with its own name', () => {
    const error = new MissingRouterAdapterError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MissingRouterAdapterError);
    expect(error.name).toBe('MissingRouterAdapterError');
  });

  it('should name both ways out', () => {
    const { message } = new MissingRouterAdapterError();

    expect(message).toContain('adapter provider');
    expect(message).toContain('second argument');
  });
});
