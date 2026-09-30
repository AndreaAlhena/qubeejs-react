import { useContext } from 'react';

import type { QubeeHandle } from '../types/qubee-handle.type';

import { qubeeContext } from '../contexts/qubee-context';
import { MissingQubeeProviderError } from '../errors/missing-qubee-provider.error';
import { useQubeeHandle } from './use-qubee-handle';

/**
 * Read the nearest {@link QubeeProvider}'s instance, and re-render when its query changes.
 *
 * Each caller subscribes on its own, so only the components that use the state re-render.
 *
 * @returns The provider's builder, paginator and store, plus the store's current state
 * @throws {MissingQubeeProviderError} When no provider is above the calling component
 *
 * @example
 * ```tsx
 * function ArticleFilters(): ReactElement {
 *   const { builder } = useQubeeContext();
 *
 *   return <button onClick={() => builder.addFilter('status', 'published')}>Published</button>;
 * }
 * ```
 */
export function useQubeeContext(): QubeeHandle {
  const qubee = useContext(qubeeContext);

  if (!qubee) {
    throw new MissingQubeeProviderError();
  }

  return useQubeeHandle(qubee);
}
