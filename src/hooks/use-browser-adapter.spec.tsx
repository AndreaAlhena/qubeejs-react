import type { ReactElement } from 'react';

import { toSearchParams } from '@qubeejs/core';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { useBrowserAdapter } from './use-browser-adapter';

describe('useBrowserAdapter', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/articles?q=react');
  });

  describe('location', () => {
    it('should read the current pathname and query', () => {
      const { result } = renderHook(() => useBrowserAdapter(), { wrapper: StrictMode });

      expect(result.current.pathname).toBe('/articles');
      expect(result.current.search).toBe('q=react');
    });

    it('should keep the same router while the URL is unchanged', () => {
      const { rerender, result } = renderHook(() => useBrowserAdapter(), { wrapper: StrictMode });
      const router = result.current;

      rerender();

      expect(result.current).toBe(router);
    });
  });

  describe('navigate', () => {
    it('should follow its own navigations', () => {
      const { result } = renderHook(() => useBrowserAdapter(), { wrapper: StrictMode });

      act(() => {
        result.current.navigate('/articles?page=2', { replace: false });
      });

      expect(result.current.search).toBe('page=2');
      expect(window.location.search).toBe('?page=2');
    });

    it('should keep every instance in sync', () => {
      const first = renderHook(() => useBrowserAdapter(), { wrapper: StrictMode });
      const second = renderHook(() => useBrowserAdapter(), { wrapper: StrictMode });

      act(() => {
        first.result.current.navigate('/authors', { replace: true });
      });

      expect(second.result.current.pathname).toBe('/authors');
      expect(second.result.current.search).toBe('');
    });
  });

  describe('history', () => {
    it('should follow the back and forward buttons', () => {
      const { result } = renderHook(() => useBrowserAdapter(), { wrapper: StrictMode });

      act(() => {
        window.history.pushState(null, '', '/authors?page=3');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(result.current.pathname).toBe('/authors');
      expect(result.current.search).toBe('page=3');
    });
  });

  describe('server rendering', () => {
    it('should render with an empty location', () => {
      function Probe(): ReactElement {
        const router = useBrowserAdapter();

        return <output>{`${router.pathname}|${toSearchParams(router.search).toString()}`}</output>;
      }

      expect(
        renderToString(
          <StrictMode>
            <Probe />
          </StrictMode>
        )
      ).toBe('<output>|</output>');
    });
  });
});
