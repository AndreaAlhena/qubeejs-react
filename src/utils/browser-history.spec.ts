import {
  navigateBrowserHistory,
  readBrowserLocation,
  readServerLocation,
  subscribeToBrowserHistory,
} from './browser-history';

describe('browser history', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  describe('readBrowserLocation', () => {
    it('should read the pathname and the query, without the hash', () => {
      window.history.replaceState(null, '', '/articles?q=react#top');

      expect(readBrowserLocation()).toBe('/articles?q=react');
    });
  });

  describe('readServerLocation', () => {
    it('should be empty', () => {
      expect(readServerLocation()).toBe('');
    });
  });

  describe('navigateBrowserHistory', () => {
    it('should push a history entry', () => {
      const before = window.history.length;

      navigateBrowserHistory('/articles?page=2', { replace: false });

      expect(window.history.length).toBe(before + 1);
      expect(readBrowserLocation()).toBe('/articles?page=2');
    });

    it('should replace the current entry', () => {
      const before = window.history.length;

      navigateBrowserHistory('/articles?q=react', { replace: true });

      expect(window.history.length).toBe(before);
      expect(readBrowserLocation()).toBe('/articles?q=react');
    });

    it('should notify subscribers', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToBrowserHistory(listener);

      navigateBrowserHistory('/articles', { replace: true });
      unsubscribe();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToBrowserHistory', () => {
    it('should notify on popstate', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToBrowserHistory(listener);

      window.dispatchEvent(new PopStateEvent('popstate'));
      unsubscribe();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should stop notifying after unsubscribing', () => {
      const listener = vi.fn();

      subscribeToBrowserHistory(listener)();
      navigateBrowserHistory('/articles', { replace: true });
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
