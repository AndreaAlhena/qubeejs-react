import type { QubeeConfig } from '@qubeejs/core';

import { createQubee } from '@qubeejs/core';
import { useState } from 'react';

import type { QubeeHandle } from '../types/qubee-handle.type';

import { useQubeeHandle } from './use-qubee-handle';

/**
 * Give a component a qubee instance of its own, and re-render it whenever the query changes.
 *
 * For lists whose state lives in memory — a dialog, a picker, an app without routing. The
 * instance is created once, on the first render; later changes to `config` are ignored, so
 * remount the component with a `key` to switch drivers. To share one instance between
 * components, use {@link QubeeProvider}.
 *
 * @param config - The driver, plus an optional base URL and request/response key overrides
 * @returns The builder, paginator and store, plus the store's current state
 *
 * @example
 * ```tsx
 * function ArticlePicker(): ReactElement {
 *   const { builder, state } = useQubee({ driver: STRAPI_DRIVER });
 *
 *   return <button onClick={() => builder.nextPage()}>Page {state.page}</button>;
 * }
 * ```
 */
export function useQubee(config: QubeeConfig): QubeeHandle {
  const [qubee] = useState(() => createQubee(config));

  return useQubeeHandle(qubee);
}
