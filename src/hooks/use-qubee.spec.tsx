import type { ReactElement } from 'react';

import { STRAPI_DRIVER } from '@qubeejs/core';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { useQubee } from './use-qubee';

const STRAPI_PAGE = {
  data: [{ id: 1, title: 'Hooks in depth' }],
  meta: { pagination: { page: 1, pageCount: 3, pageSize: 25, total: 57 } },
};

describe('useQubee', () => {
  describe('state', () => {
    it('should start from the store initial snapshot', () => {
      const { result } = renderHook(() => useQubee({ driver: STRAPI_DRIVER }), {
        wrapper: StrictMode,
      });

      expect(result.current.state.page).toBe(1);
      expect(result.current.state.limit).toBe(15);
    });

    it('should re-render when the builder writes to the store', () => {
      const { result } = renderHook(() => useQubee({ driver: STRAPI_DRIVER }), {
        wrapper: StrictMode,
      });

      act(() => {
        result.current.builder.setResource('articles').setLimit(25);
      });

      expect(result.current.state.resource).toBe('articles');
      expect(result.current.state.limit).toBe(25);
    });

    it('should re-render when the paginator syncs the last page', () => {
      const { result } = renderHook(() => useQubee({ driver: STRAPI_DRIVER }), {
        wrapper: StrictMode,
      });

      act(() => {
        result.current.paginator.paginate(STRAPI_PAGE);
      });

      expect(result.current.state.isLastPageKnown).toBe(true);
      expect(result.current.state.lastPage).toBe(3);
    });

    it('should apply the configured base URL', () => {
      const { result } = renderHook(
        () => useQubee({ baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER }),
        { wrapper: StrictMode }
      );

      expect(result.current.state.baseUrl).toBe('https://api.example.com');
    });
  });

  describe('instance', () => {
    it('should keep the builder, paginator and store across renders', () => {
      const { rerender, result } = renderHook(() => useQubee({ driver: STRAPI_DRIVER }), {
        wrapper: StrictMode,
      });
      const { builder, paginator, store } = result.current;

      rerender();

      expect(result.current.builder).toBe(builder);
      expect(result.current.paginator).toBe(paginator);
      expect(result.current.store).toBe(store);
    });

    it('should ignore config changes after the first render', () => {
      const { rerender, result } = renderHook(
        ({ baseUrl }: { baseUrl: string }) => useQubee({ baseUrl, driver: STRAPI_DRIVER }),
        { initialProps: { baseUrl: 'https://a.example.com' }, wrapper: StrictMode }
      );

      rerender({ baseUrl: 'https://b.example.com' });

      expect(result.current.state.baseUrl).toBe('https://a.example.com');
    });

    it('should return the same handle while the state is unchanged', () => {
      const { rerender, result } = renderHook(() => useQubee({ driver: STRAPI_DRIVER }), {
        wrapper: StrictMode,
      });
      const handle = result.current;

      rerender();

      expect(result.current).toBe(handle);
    });
  });

  describe('server rendering', () => {
    it('should render the initial snapshot', () => {
      function Probe(): ReactElement {
        const { state } = useQubee({ driver: STRAPI_DRIVER });

        return <output>{state.page}</output>;
      }

      expect(
        renderToString(
          <StrictMode>
            <Probe />
          </StrictMode>
        )
      ).toBe('<output>1</output>');
    });
  });
});
