'use client';

import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  faBan,
  faClock,
  faGift,
  faMotorcycle,
  faPercent,
  faScaleBalanced,
  faSackDollar,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { GET_MEMBERSHIP_REPORT } from '@/lib/api/graphql';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { Field, TextInput } from '@/lib/ui/useable-components/admin-form';
import StatsCard from '@/lib/ui/useable-components/stats-card';
import { IMembershipReport } from '@/lib/utils/interfaces';

const round = (n: number) => Math.round(n * 100) / 100;

export default function MembershipOverview() {
  const t = useTranslations();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, loading } = useQuery<{ membershipReport: IMembershipReport }>(
    GET_MEMBERSHIP_REPORT,
    {
      variables: { from: from || null, to: to || null },
      fetchPolicy: 'cache-and-network',
    }
  );
  const r = data?.membershipReport;
  const busy = loading && !r;

  const card = (props: {
    label: string;
    total: number;
    description?: string;
    icon: typeof faUsers;
    money?: boolean;
  }) => (
    <StatsCard
      label={props.label}
      total={props.money ? round(props.total) : props.total}
      description={props.description}
      icon={props.icon}
      currencySymbol={props.money ? CURRENCY_SYMBOL : undefined}
      loading={busy}
      isClickable={false}
      route=""
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-500">{t('membership_overview_intro')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {card({
          label: t('membership_active_members'),
          total: r?.activeMembers ?? 0,
          icon: faUsers,
        })}
        {card({
          label: t('membership_trialing'),
          total: r?.trialingMembers ?? 0,
          icon: faClock,
        })}
        {card({
          label: t('membership_past_due'),
          total: r?.pastDueMembers ?? 0,
          icon: faBan,
        })}
        {card({
          label: t('membership_granted'),
          total: r?.grantedMembers ?? 0,
          icon: faGift,
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Field label={t('membership_from')} htmlFor="report-from">
            <TextInput
              id="report-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
        </div>
        <div className="w-44">
          <Field label={t('membership_to')} htmlFor="report-to">
            <TextInput
              id="report-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
        {from || to ? (
          <button
            type="button"
            className="h-10 text-sm text-primary-color underline"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            {t('membership_all_time')}
          </button>
        ) : (
          <span className="pb-2 text-sm text-gray-500">
            {t('membership_all_time')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {card({
          label: t('membership_revenue'),
          total: r?.revenue ?? 0,
          money: true,
          icon: faSackDollar,
          description: t('membership_payments_count', {
            count: r?.payments ?? 0,
          }),
        })}
        {card({
          label: t('membership_delivery_covered'),
          total: r?.deliverySavings ?? 0,
          money: true,
          icon: faMotorcycle,
          description: t('membership_orders_count', {
            count: r?.freeDeliveryOrders ?? 0,
          }),
        })}
        {card({
          label: t('membership_order_discounts'),
          total: r?.orderDiscounts ?? 0,
          money: true,
          icon: faPercent,
          description: t('membership_orders_count', {
            count: r?.memberOrders ?? 0,
          }),
        })}
        {card({
          label: t('membership_net'),
          total: r?.net ?? 0,
          money: true,
          icon: faScaleBalanced,
          description: t('membership_net_hint'),
        })}
      </div>
    </div>
  );
}
