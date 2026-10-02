import { createMemoryAdapterHook, createMemoryLocation } from './memory-location';

describe('memory location', () => {
  it('should start empty', () => {
    expect(createMemoryLocation().getSnapshot()).toBe('');
  });

  it('should normalise the initial search to a query without the question mark', () => {
    expect(createMemoryLocation('?page=2&q=a b').getSnapshot()).toBe('page=2&q=a+b');
    expect(createMemoryLocation({ status: ['draft'] }).getSnapshot()).toBe('status=draft');
  });

  it('should make a hook that is named as one', () => {
    expect(createMemoryAdapterHook(createMemoryLocation()).name).toMatch(/^use[A-Z]/);
  });
});
