'use client';

import { IMembershipBenefits, IMembershipPlan } from '@/lib/utils/interfaces';

type T = (key: string, values?: Record<string, string | number>) => string;

export const errorMessage = (error: unknown, fallback: string) =>
  (error as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.[0]
    ?.message ?? fallback;

export const money = (symbol: string | undefined, amount: number) =>
  `${symbol ?? ''}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// "RD$299 / month", "RD$799 / 3 months"
export const planPrice = (
  t: T,
  symbol: string | undefined,
  plan: Partial<Pick<IMembershipPlan, 'price' | 'interval' | 'intervalCount'>>
) =>
  plan.interval
    ? `${money(symbol, plan.price ?? 0)} / ${t(
        `membership_per_${plan.interval}`,
        {
          count: plan.intervalCount || 1,
        }
      )}`
    : '-';

// "Free delivery · 10% off (max RD$100)"
export const benefitsSummary = (
  t: T,
  symbol: string | undefined,
  b: IMembershipBenefits
) =>
  [
    b.freeDelivery ? t('membership_benefit_free_delivery') : null,
    b.orderDiscountPercent > 0
      ? b.maxOrderDiscount > 0
        ? t('membership_benefit_percent_capped', {
            percent: b.orderDiscountPercent,
            max: money(symbol, b.maxOrderDiscount),
          })
        : t('membership_benefit_percent', { percent: b.orderDiscountPercent })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
