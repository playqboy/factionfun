import type { Holder } from '../types/index.js';

export function serializeHolders(holders: Holder[]): string {
  return JSON.stringify(holders, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

export function deserializeHolders(json: string): Holder[] {
  return JSON.parse(json, (key, value) => {
    if (key === 'balance' && typeof value === 'string') return BigInt(value);
    return value;
  });
}
