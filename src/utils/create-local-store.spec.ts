import { createLocalStore } from './create-local-store';

describe('createLocalStore', () => {
  describe('getSnapshot', () => {
    it('should start from the initial value', () => {
      expect(createLocalStore(1).getSnapshot()).toBe(1);
    });
  });

  describe('update', () => {
    it('should store the reducer result and notify subscribers', () => {
      const store = createLocalStore(1);
      const listener = vi.fn();

      store.subscribe(listener);
      store.update((current) => current + 1);

      expect(store.getSnapshot()).toBe(2);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not notify when the reducer returns the same value', () => {
      const store = createLocalStore({ page: 1 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.update((current) => current);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should stop notifying after unsubscribing', () => {
      const store = createLocalStore(1);
      const listener = vi.fn();

      store.subscribe(listener)();
      store.update((current) => current + 1);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
