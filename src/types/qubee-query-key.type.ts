/**
 * The cache key of a list request: `'qubee'`, the request's address and its headers — `null`
 * and `null` when there is no request.
 *
 * {@link qubeeQueryOptions} builds it, and `useQubeeSWR` uses the same one. Every key starts with
 * `'qubee'`, so `queryClient.invalidateQueries({ queryKey: ['qubee'] })` reaches all of them.
 */
export type QubeeQueryKey = readonly [
  'qubee',
  null | string,
  null | Readonly<Record<string, string>>,
];
