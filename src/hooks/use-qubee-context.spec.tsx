import type { ReactElement, ReactNode } from 'react';

import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { QubeeProvider } from '../components/qubee-provider';
import { MissingQubeeProviderError } from '../errors/missing-qubee-provider.error';
import { useQubeeContext } from './use-qubee-context';

describe('useQubeeContext', () => {
  describe('inside a provider', () => {
    it('should return the provider instance and follow its state', () => {
      const qubee = createQubee({ driver: STRAPI_DRIVER });

      function Wrapper({ children }: { children: ReactNode }): ReactElement {
        return (
          <StrictMode>
            <QubeeProvider value={qubee}>{children}</QubeeProvider>
          </StrictMode>
        );
      }

      const { result } = renderHook(() => useQubeeContext(), { wrapper: Wrapper });

      act(() => {
        qubee.builder.setLimit(40);
      });

      expect(result.current.store).toBe(qubee.store);
      expect(result.current.state.limit).toBe(40);
    });
  });

  describe('outside a provider', () => {
    it('should throw MissingQubeeProviderError', () => {
      function Probe(): ReactElement {
        useQubeeContext();

        return <span />;
      }

      expect(() =>
        renderToString(
          <StrictMode>
            <Probe />
          </StrictMode>
        )
      ).toThrow(MissingQubeeProviderError);
    });
  });
});
