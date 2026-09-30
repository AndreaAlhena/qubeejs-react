import type { Qubee } from '@qubeejs/core';
import type { ReactElement } from 'react';

import { createQubee } from '@qubeejs/core';
import { useState } from 'react';

import type { QubeeProviderProps } from '../types/qubee-provider-props.type';

import { qubeeContext } from '../contexts/qubee-context';

/**
 * Share one qubee instance with every component below it — the filters, the table and the pager
 * of one list, as `provideNgQubeeInstance()` does in Angular.
 *
 * Pass a configuration (`driver`, and optionally `baseUrl`, `pagination`, `request`,
 * `response`) and the provider creates the instance once, on its first render; later changes to
 * the configuration are ignored. Or pass `value` to share an instance created elsewhere.
 *
 * The context carries the instance, never its state, so the provider does not re-render its
 * subtree when the query changes: only components that call {@link useQubeeContext} do. The
 * nearest provider wins, so nesting scopes a subtree.
 *
 * @param props - A configuration or a `value`, plus the subtree
 * @returns The subtree, with the instance in context
 *
 * @example
 * ```tsx
 * <QubeeProvider baseUrl="https://example.com/api" driver={STRAPI_DRIVER}>
 *   <ArticleFilters />
 *   <ArticleTable />
 * </QubeeProvider>
 * ```
 */
export function QubeeProvider(props: QubeeProviderProps): ReactElement {
  const [created] = useState<Qubee>(() => ('driver' in props ? createQubee(props) : props.value));
  const qubee = 'driver' in props ? created : props.value;

  return <qubeeContext.Provider value={qubee}>{props.children}</qubeeContext.Provider>;
}
