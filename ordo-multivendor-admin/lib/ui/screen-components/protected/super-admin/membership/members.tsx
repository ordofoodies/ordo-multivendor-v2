'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { Dialog } from 'primereact/dialog';
import { Sidebar } from 'primereact/sidebar';
import { Tag } from 'primereact/tag';
import { useEffect, useRef, useState } from 'react';

import {
  GET_MEMBERSHIP_PLANS,
  GET_MEMBERSHIPS,
  GRANT_MEMBERSHIP,
  REVOKE_MEMBERSHIP,
} from '@/lib/api/graphql';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import useToast from '@/lib/hooks/useToast';
import Table from '@/lib/ui/useable-components/table';
import {
  ActionButton,
  Callout,
  DialogActions,
  Field,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from '@/lib/ui/useable-components/admin-form';
import {
  IMembershipPlan,
  IMembershipRecord,
  TMembershipStatus,
} from '@/lib/utils/interfaces';

import { benefitsSummary, errorMessage, planPrice } from './shared';

const STATUS_SEVERITY: Record<
  TMembershipStatus,
  'info' | 'success' | 'warning' | 'danger' | 'secondary'
> = {
  trialing: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'danger',
  expired: 'secondary',
};
const FILTERS = [
  'ACTIVE',
  'trialing',
  'past_due',
  'canceled',
  'expired',
  'ALL',
] as const;
type Filter = (typeof FILTERS)[number];

const EMPTY_GRANT = {
  email: '',
  days: 30,
  planId: null as string | null,
  note: '',
};

export default function MembershipMembers({
  addRequest,
}: {
  addRequest: number;
}) {
  const t = useTranslations();
  const { showToast } = useToast();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [grant, setGrant] = useState<typeof EMPTY_GRANT | null>(null);
  const [selected, setSelected] = useState<IMembershipRecord | null>(null);

  // header "Grant membership" button
  const seenRequest = useRef(addRequest);
  useEffect(() => {
    if (addRequest === seenRequest.current) return;
    seenRequest.current = addRequest;
    setGrant({ ...EMPTY_GRANT });
  }, [addRequest]);

  const { data, loading, refetch } = useQuery<{
    memberships: IMembershipRecord[];
  }>(GET_MEMBERSHIPS, {
    variables: { status: filter === 'ALL' ? null : filter },
    fetchPolicy: 'cache-and-network',
  });
  const { data: plansData } = useQuery<{ membershipPlans: IMembershipPlan[] }>(
    GET_MEMBERSHIP_PLANS
  );

  const failed = (error: unknown) =>
    showToast({
      type: 'error',
      title: t('Error'),
      message: errorMessage(error, t('membership_save_failed')),
    });
  const [grantMembership, { loading: granting }] = useMutation(
    GRANT_MEMBERSHIP,
    {
      onCompleted: () => {
        setGrant(null);
        refetch();
        showToast({
          type: 'success',
          title: t('Success'),
          message: t('membership_granted_toast'),
        });
      },
      onError: failed,
    }
  );
  const [revokeMembership, { loading: revoking }] = useMutation(
    REVOKE_MEMBERSHIP,
    {
      onCompleted: () => {
        setSelected(null);
        refetch();
        showToast({
          type: 'success',
          title: t('Success'),
          message: t('membership_revoked_toast'),
        });
      },
      onError: failed,
    }
  );

  const submitGrant = () => {
    if (!grant) return;
    if (!/^\S+@\S+\.\S+$/.test(grant.email.trim())) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: t('membership_email_invalid'),
      });
      return;
    }
    grantMembership({
      variables: {
        email: grant.email.trim().toLowerCase(),
        days: grant.days,
        planId: grant.planId,
        note: grant.note.trim() || null,
      },
    });
  };

  const statusTag = (row: IMembershipRecord) => (
    <Tag
      severity={STATUS_SEVERITY[row.status]}
      value={t(`membership_status_${row.status}`)}
    />
  );
  const date = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : '-';

  const columns = [
    {
      headerName: t('membership_customer'),
      propertyName: 'user.email',
      body: (row: IMembershipRecord) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.user?.name || '-'}</span>
          <span className="text-xs text-gray-500">{row.user?.email ?? ''}</span>
        </div>
      ),
    },
    {
      headerName: t('membership_plan'),
      propertyName: 'planSnapshot.name',
      body: (row: IMembershipRecord) => (
        <div className="flex flex-col">
          <span>{row.planSnapshot?.name ?? '-'}</span>
          {row.planSnapshot?.interval ? (
            <span className="text-xs text-gray-500">
              {planPrice(t, CURRENCY_SYMBOL, row.planSnapshot)}
            </span>
          ) : null}
          <span className="text-xs text-gray-500">
            {benefitsSummary(t, CURRENCY_SYMBOL, row.benefits)}
          </span>
        </div>
      ),
    },
    {
      headerName: t('membership_source'),
      propertyName: 'source',
      body: (row: IMembershipRecord) =>
        row.source === 'admin'
          ? t('membership_source_admin')
          : t('membership_source_stripe'),
    },
    { headerName: t('Status'), propertyName: 'status', body: statusTag },
    {
      headerName: t('membership_period_end'),
      propertyName: 'currentPeriodEnd',
      body: (row: IMembershipRecord) => (
        <div className="flex flex-col">
          <span>{date(row.currentPeriodEnd)}</span>
          {row.cancelAtPeriodEnd ? (
            <span className="text-xs text-red-500">
              {t('membership_wont_renew')}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      headerName: t('membership_joined'),
      propertyName: 'createdAt',
      body: (row: IMembershipRecord) => date(row.createdAt),
    },
  ];

  const grantPlan = (plansData?.membershipPlans ?? []).find(
    (p) => p._id === grant?.planId
  );
  const grantUntil = grant
    ? new Date(
        Date.now() + Math.max(1, grant.days || 1) * 86400000
      ).toLocaleDateString()
    : '';
  const grantBenefits = benefitsSummary(
    t,
    CURRENCY_SYMBOL,
    grantPlan ?? {
      freeDelivery: true,
      orderDiscountPercent: 0,
      maxOrderDiscount: 0,
    }
  );
  const canRevoke =
    !!selected && ['trialing', 'active', 'past_due'].includes(selected.status);

  return (
    <>
      <Table
        data={data?.memberships ?? []}
        columns={columns}
        loading={loading}
        moduleName="Membership-Members"
        handleRowClick={(event) => setSelected(event.data as IMembershipRecord)}
        header={
          <div className="mb-3 flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              {t('membership_members_intro')}
            </p>
            <div className="flex flex-wrap gap-2">
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
                  {value === 'ALL'
                    ? t('All')
                    : value === 'ACTIVE'
                      ? t('membership_filter_current')
                      : t(`membership_status_${value}`)}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <Sidebar
        visible={!!grant}
        onHide={() => setGrant(null)}
        position="right"
        className="w-full border sm:w-[450px] dark:border-dark-600 dark:bg-dark-950 dark:text-white"
      >
        {grant ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">{t('membership_grant')}</h2>
            <Callout tone="info">{t('membership_grant_hint')}</Callout>
            <Field
              label={t('membership_customer_email')}
              required
              htmlFor="grant-email"
              hint={t('membership_customer_email_hint')}
            >
              <TextInput
                id="grant-email"
                type="email"
                value={grant.email}
                placeholder="customer@email.com"
                onChange={(e) => setGrant({ ...grant, email: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('membership_days')} required htmlFor="grant-days">
                <NumberInput
                  id="grant-days"
                  value={grant.days}
                  min={1}
                  max={3650}
                  step={1}
                  suffix={t('membership_days_unit')}
                  onValueChange={(v) =>
                    setGrant({
                      ...grant,
                      days: Math.min(3650, Math.max(1, Math.round(v))),
                    })
                  }
                />
              </Field>
              <Field label={t('membership_plan_optional')} htmlFor="grant-plan">
                <Select
                  id="grant-plan"
                  value={grant.planId ?? ''}
                  onChange={(e) =>
                    setGrant({ ...grant, planId: e.target.value || null })
                  }
                  options={[
                    { value: '', label: t('membership_no_plan') },
                    ...(plansData?.membershipPlans ?? []).map((p) => ({
                      value: p._id,
                      label: p.name,
                    })),
                  ]}
                />
              </Field>
            </div>
            <Field
              label={t('membership_note')}
              hint={t('membership_note_hint')}
              htmlFor="grant-note"
            >
              <TextArea
                id="grant-note"
                rows={3}
                value={grant.note}
                onChange={(e) => setGrant({ ...grant, note: e.target.value })}
              />
            </Field>
            <Callout tone="success">
              {t('membership_grant_summary', {
                email: grant.email.trim() || t('membership_this_customer'),
                benefits: grantBenefits,
                date: grantUntil,
              })}
            </Callout>
            <DialogActions>
              <ActionButton variant="secondary" onClick={() => setGrant(null)}>
                {t('Cancel')}
              </ActionButton>
              <ActionButton loading={granting} onClick={submitGrant}>
                {t('membership_grant')}
              </ActionButton>
            </DialogActions>
          </div>
        ) : null}
      </Sidebar>

      <Dialog
        visible={!!selected}
        onHide={() => setSelected(null)}
        header={selected?.user?.name || selected?.user?.email || ''}
        className="w-[95vw] max-w-md"
      >
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-gray-500">{t('Email')}</dt>
              <dd className="font-medium">{selected.user?.email ?? '-'}</dd>
              <dt className="text-gray-500">{t('Status')}</dt>
              <dd>{statusTag(selected)}</dd>
              <dt className="text-gray-500">{t('membership_source')}</dt>
              <dd>
                {selected.source === 'admin'
                  ? t('membership_source_admin')
                  : t('membership_source_stripe')}
              </dd>
              <dt className="text-gray-500">{t('membership_plan')}</dt>
              <dd>{selected.planSnapshot?.name ?? t('membership_no_plan')}</dd>
              <dt className="text-gray-500">{t('membership_benefits')}</dt>
              <dd>{benefitsSummary(t, CURRENCY_SYMBOL, selected.benefits)}</dd>
              <dt className="text-gray-500">{t('membership_period_end')}</dt>
              <dd>
                {date(selected.currentPeriodEnd)}
                {selected.cancelAtPeriodEnd
                  ? ` · ${t('membership_wont_renew')}`
                  : ''}
              </dd>
            </dl>
            {selected.note ? (
              <p className="rounded-md bg-gray-50 p-3 dark:bg-dark-900">
                {selected.note}
              </p>
            ) : null}
            {canRevoke ? (
              <Callout tone="danger">
                {selected.source === 'stripe'
                  ? t('membership_revoke_stripe_hint')
                  : t('membership_revoke_hint')}
              </Callout>
            ) : null}
            <DialogActions>
              <ActionButton
                variant="secondary"
                onClick={() => setSelected(null)}
              >
                {t('Close')}
              </ActionButton>
              {canRevoke ? (
                <ActionButton
                  variant="danger"
                  icon="pi pi-ban"
                  loading={revoking}
                  onClick={() =>
                    revokeMembership({ variables: { id: selected._id } })
                  }
                >
                  {t('membership_revoke')}
                </ActionButton>
              ) : null}
            </DialogActions>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
