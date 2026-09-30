import type { Qubee } from '@qubeejs/core';
import type { ReactElement } from 'react';

import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';

import type { QubeeHandle } from '../types/qubee-handle.type';

import { useQubeeContext } from '../hooks/use-qubee-context';
import { QubeeProvider } from './qubee-provider';

describe('QubeeProvider', () => {
  describe('with a configuration', () => {
    it('should give its subtree an instance it creates', () => {
      function Consumer(): ReactElement {
        const { state } = useQubeeContext();

        return <output data-testid="base-url">{state.baseUrl}</output>;
      }

      render(
        <StrictMode>
          <QubeeProvider baseUrl="https://api.example.com" driver={STRAPI_DRIVER}>
            <Consumer />
          </QubeeProvider>
        </StrictMode>
      );

      expect(screen.getByTestId('base-url').textContent).toBe('https://api.example.com');
    });

    it('should keep its instance across re-renders', () => {
      const handles: QubeeHandle[] = [];

      function Consumer(): ReactElement {
        handles.push(useQubeeContext());

        return <span />;
      }

      const tree = (baseUrl: string): ReactElement => (
        <StrictMode>
          <QubeeProvider baseUrl={baseUrl} driver={STRAPI_DRIVER}>
            <Consumer />
          </QubeeProvider>
        </StrictMode>
      );
      const { rerender } = render(tree('https://a.example.com'));

      rerender(tree('https://b.example.com'));

      expect(handles.at(-1)?.store).toBe(handles[0].store);
      expect(handles.at(-1)?.state.baseUrl).toBe('https://a.example.com');
    });
  });

  describe('with a value', () => {
    it('should share the given instance', () => {
      const qubee = createQubee({ driver: STRAPI_DRIVER });
      let handle: QubeeHandle | undefined;

      function Consumer(): ReactElement {
        handle = useQubeeContext();

        return <span />;
      }

      render(
        <StrictMode>
          <QubeeProvider value={qubee}>
            <Consumer />
          </QubeeProvider>
        </StrictMode>
      );

      expect(handle?.builder).toBe(qubee.builder);
    });

    it('should follow a new value', () => {
      const first = createQubee({ baseUrl: 'https://a.example.com', driver: STRAPI_DRIVER });
      const second = createQubee({ baseUrl: 'https://b.example.com', driver: STRAPI_DRIVER });

      function Consumer(): ReactElement {
        const { state } = useQubeeContext();

        return <output data-testid="base-url">{state.baseUrl}</output>;
      }

      const tree = (value: Qubee): ReactElement => (
        <StrictMode>
          <QubeeProvider value={value}>
            <Consumer />
          </QubeeProvider>
        </StrictMode>
      );
      const { rerender } = render(tree(first));

      rerender(tree(second));
      act(() => {
        second.builder.setLimit(40);
      });

      expect(screen.getByTestId('base-url').textContent).toBe('https://b.example.com');
    });
  });

  describe('re-rendering', () => {
    it('should re-render consumers, not the rest of its subtree, when the state changes', () => {
      let bystanderRenders = 0;
      let handle: QubeeHandle | undefined;

      function Bystander(): ReactElement {
        bystanderRenders += 1;

        return <span />;
      }

      function Consumer(): ReactElement {
        handle = useQubeeContext();

        return <output data-testid="limit">{handle.state.limit}</output>;
      }

      render(
        <StrictMode>
          <QubeeProvider driver={STRAPI_DRIVER}>
            <Bystander />
            <Consumer />
          </QubeeProvider>
        </StrictMode>
      );
      const rendersBefore = bystanderRenders;

      act(() => {
        handle?.builder.setLimit(30);
      });

      expect(screen.getByTestId('limit').textContent).toBe('30');
      expect(bystanderRenders).toBe(rendersBefore);
    });
  });

  describe('nesting', () => {
    it('should let the nearest provider win', () => {
      function Consumer(): ReactElement {
        const { state } = useQubeeContext();

        return <output data-testid="base-url">{state.baseUrl}</output>;
      }

      render(
        <StrictMode>
          <QubeeProvider baseUrl="https://outer.example.com" driver={STRAPI_DRIVER}>
            <QubeeProvider baseUrl="https://inner.example.com" driver={STRAPI_DRIVER}>
              <Consumer />
            </QubeeProvider>
          </QubeeProvider>
        </StrictMode>
      );

      expect(screen.getByTestId('base-url').textContent).toBe('https://inner.example.com');
    });
  });
});
