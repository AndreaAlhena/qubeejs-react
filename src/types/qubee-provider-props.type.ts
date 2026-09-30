import type { Qubee, QubeeConfig } from '@qubeejs/core';
import type { ReactNode } from 'react';

/**
 * Props of {@link QubeeProvider}: either the configuration of an instance the provider creates
 * and owns, or an instance created elsewhere — never both.
 */
export type QubeeProviderProps =
  | (QubeeConfig & {
      /** The subtree that shares the instance. */
      children: ReactNode;
      /** Not allowed with a configuration: pass one or the other. */
      value?: never;
    })
  | {
      /** The subtree that shares the instance. */
      children: ReactNode;
      /** An instance created elsewhere, e.g. by `createQubee()`. */
      value: Qubee;
    };
