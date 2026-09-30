import { createDebouncer } from './create-debouncer';

describe('createDebouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('schedule', () => {
    it('should run the callback after the delay', () => {
      const callback = vi.fn();

      createDebouncer().schedule(callback, 300);
      vi.advanceTimersByTime(299);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should replace a callback still pending', () => {
      const debouncer = createDebouncer();
      const first = vi.fn();
      const second = vi.fn();

      debouncer.schedule(first, 300);
      vi.advanceTimersByTime(200);
      debouncer.schedule(second, 300);
      vi.advanceTimersByTime(300);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('should drop the pending callback', () => {
      const debouncer = createDebouncer();
      const callback = vi.fn();

      debouncer.schedule(callback, 300);
      debouncer.cancel();
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
