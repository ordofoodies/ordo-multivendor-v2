'use client';

// Core
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// PrimeReact
import { Tag } from 'primereact/tag';

// Localization
import { useTranslations } from 'next-intl';

// GraphQL
import { GET_MERCHANT_APPLICATIONS } from '@/lib/api/graphql';

// Hooks
import { useQueryGQL } from '@/lib/hooks/useQueryQL';

// Components
import HeaderText from '@/lib/ui/useable-components/header-text';
import Table from '@/lib/ui/useable-components/table';

// Interfaces
import {
  IMerchantApplicationSummary,
  IQueryResult,
  TMerchantApplicationStatus,
} from '@/lib/utils/interfaces';

export const STATUS_SEVERITY: Record<
  TMerchantApplicationStatus,
  'info' | 'warning' | 'success' | 'danger'
> = {
  SUBMITTED: 'info',
  NEEDS_INFO: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const FILTERS: (TMerchantApplicationStatus | 'ALL')[] = [
  'SUBMITTED',
  'NEEDS_INFO',
  'APPROVED',
  'REJECTED',
  'ALL',
];

export default function MerchantApplicationsScreen() {
  const t = useTranslations();
  const router = useRouter();
  const [filter, setFilter] = useState<TMerchantApplicationStatus | 'ALL'>('SUBMITTED');

  const { data, loading } = useQueryGQL(
    GET_MERCHANT_APPLICATIONS,
    { status: filter === 'ALL' ? null : filter },
    { fetchPolicy: 'cache-and-network' }
  ) as IQueryResult<{ merchantApplications: IMerchantApplicationSummary[] } | undefined, undefined>;

  const columns = [
    {
      headerName: t('merchant_app_store'),
      propertyName: 'store.name',
      body: (row: IMerchantApplicationSummary) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.store.name}</span>
          <span className="text-xs text-gray-500">{row.store.shopType?.name ?? ''}</span>
        </div>
      ),
    },
    {
      headerName: t('merchant_app_owner'),
      propertyName: 'owner.email',
      body: (row: IMerchantApplicationSummary) => (
        <div className="flex flex-col">
          <span>{`${row.owner.firstName} ${row.owner.lastName}`}</span>
          <span className="text-xs text-gray-500">{row.owner.email}</span>
        </div>
      ),
    },
    {
      headerName: t('Zone'),
      propertyName: 'store.zone.name',
      body: (row: IMerchantApplicationSummary) => row.store.zone?.name ?? '-',
    },
    {
      headerName: t('merchant_app_submitted'),
      propertyName: 'createdAt',
      body: (row: IMerchantApplicationSummary) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
    },
    {
      headerName: t('Status'),
      propertyName: 'status',
      body: (row: IMerchantApplicationSummary) => (
        <Tag
          severity={STATUS_SEVERITY[row.status]}
          value={t(`merchant_app_status_${row.status.toLowerCase()}`)}
        />
      ),
    },
  ];

  return (
    <div className="screen-container p-3">
      <HeaderText className="heading" text={t('merchant_applications')} />

      <div className="my-4 flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              filter === value
                ? 'border-primary-color bg-primary-color text-white'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            {value === 'ALL' ? t('All') : t(`merchant_app_status_${value.toLowerCase()}`)}
          </button>
        ))}
      </div>

      <Table
        data={data?.merchantApplications ?? []}
        columns={columns}
        loading={loading}
        moduleName="Merchant-Applications"
        handleRowClick={(event) =>
          router.push(`/general/merchant-applications/${(event.data as IMerchantApplicationSummary)._id}`)
        }
      />
    </div>
  );
}
