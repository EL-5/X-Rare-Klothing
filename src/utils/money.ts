import type { Money } from '@/types/domain';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currency }).format(
    money.cents / 100,
  );
}
