'use client';

// Core
import { useMutation } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

// PrimeReact
import { Dialog } from 'primereact/dialog';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';

// Localization
import { useTranslations } from 'next-intl';

// GraphQL
import {
  APPROVE_MERCHANT_APPLICATION,
  GET_MERCHANT_APPLICATION,
  REJECT_MERCHANT_APPLICATION,
  REQUEST_MERCHANT_APPLICATION_INFO,
} from '@/lib/api/graphql';

// Hooks
import { useQueryGQL } from '@/lib/hooks/useQueryQL';
import useToast from '@/lib/hooks/useToast';

// Components
import HeaderText from '@/lib/ui/useable-components/header-text';
import {
  ActionButton,
  Callout,
  DialogActions,
  Field,
  NumberInput,
  TextArea,
} from '@/lib/ui/useable-components/admin-form';

// Utils
import { onUseLocalStorage } from '@/lib/utils/methods';

// Interfaces
import { IMerchantApplication, IQueryResult } from '@/lib/utils/interfaces';

import { STATUS_SEVERITY } from '.';

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col overflow-hidden rounded-lg border">
    <header className="border-b-[1px] bg-[#F4F4F5] px-6 py-3 text-lg font-medium dark:bg-dark-900">
      {title}
    </header>
    <div className="flex flex-col gap-3 px-6 py-5">{children}</div>
  </div>
);

const Item = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="font-medium break-words">{value || '-'}</span>
  </div>
);

const Thumb = ({ url, label }: { url?: string | null; label: string }) =>
  url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1" title={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="h-24 w-32 rounded-md border object-cover" />
      <span className="text-xs text-gray-500">{label}</span>
    </a>
  ) : null;

const errorMessage = (error: unknown, fallback: string) =>
  (error as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.[0]?.message ?? fallback;

export default function MerchantApplicationDetailScreen() {
  const t = useTranslations();
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useParams();
  const [dialog, setDialog] = useState<'approve' | 'changes' | 'reject' | null>(null);
  const [radius, setRadius] = useState<number>(5);
  const [note, setNote] = useState('');
  const closeDialog = () => {
    setDialog(null);
    setNote('');
  };

  const { data, loading, refetch } = useQueryGQL(
    GET_MERCHANT_APPLICATION,
    { id: id?.toString() },
    { fetchPolicy: 'cache-and-network' }
  ) as IQueryResult<{ merchantApplication: IMerchantApplication } | undefined, undefined> & {
    refetch: () => void;
  };
  const application = data?.merchantApplication;

  const done = (message: string) => () => {
    setDialog(null);
    setNote('');
    refetch();
    showToast({ type: 'success', title: t('Success'), message });
  };
  const failed = (error: unknown) =>
    showToast({ type: 'error', title: t('Error'), message: errorMessage(error, t('merchant_app_action_failed')) });

  const [approve, { loading: approving }] = useMutation(APPROVE_MERCHANT_APPLICATION, {
    onCompleted: done(t('merchant_app_approved_toast')),
    onError: failed,
  });
  const [requestChanges, { loading: requesting }] = useMutation(REQUEST_MERCHANT_APPLICATION_INFO, {
    onCompleted: done(t('merchant_app_changes_toast')),
    onError: failed,
  });
  const [reject, { loading: rejecting }] = useMutation(REJECT_MERCHANT_APPLICATION, {
    onCompleted: done(t('merchant_app_rejected_toast')),
    onError: failed,
  });

  if (loading && !application) {
    return (
      <div className="screen-container p-3">
        <Skeleton height="2rem" width="16rem" />
        <Skeleton height="20rem" className="mt-4" />
      </div>
    );
  }
  if (!application) return null;

  const { owner, business, store, bank } = application;
  const canDecide = application.status === 'SUBMITTED';
  const hours = [...(store.openingTimes ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  const openStore = () => {
    if (!application.restaurant) return;
    onUseLocalStorage('save', 'restaurantId', application.restaurant);
    onUseLocalStorage('save', 'shopType', store.shopType?.name ?? 'restaurant');
    onUseLocalStorage('save', 'routeStack', JSON.stringify(['Admin']));
    router.push('/admin/store/');
  };

  return (
    <div className="screen-container p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeaderText className="heading" text={store.name} />
          <Tag
            severity={STATUS_SEVERITY[application.status]}
            value={t(`merchant_app_status_${application.status.toLowerCase()}`)}
          />
        </div>
        {application.status === 'APPROVED' && application.restaurant ? (
          <ActionButton variant="secondary" icon="pi pi-external-link" onClick={openStore}>
            {t('merchant_app_open_store')}
          </ActionButton>
        ) : null}
      </div>

      {/* what the reviewer can do, always at the top */}
      {['SUBMITTED', 'NEEDS_INFO'].includes(application.status) ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4 md:flex-row md:items-center md:justify-between dark:border-orange-900 dark:bg-orange-950/20">
          <div className="flex items-start gap-3">
            <i className="pi pi-inbox mt-0.5 text-lg text-primary-color" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {canDecide ? t('merchant_app_review_banner') : t('merchant_app_waiting_applicant')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {canDecide ? t('merchant_app_review_banner_hint') : t('merchant_app_waiting_applicant_hint')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDecide ? (
              <>
                <ActionButton variant="success" icon="pi pi-check" onClick={() => setDialog('approve')}>
                  {t('Approve')}
                </ActionButton>
                <ActionButton variant="secondary" icon="pi pi-replay" onClick={() => setDialog('changes')}>
                  {t('merchant_app_request_changes')}
                </ActionButton>
              </>
            ) : null}
            <ActionButton variant="danger-outline" icon="pi pi-times" onClick={() => setDialog('reject')}>
              {t('Reject')}
            </ActionButton>
          </div>
        </div>
      ) : null}

      {application.reviewNote && application.status !== 'APPROVED' ? (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <b>{t('merchant_app_review_note')}:</b> {application.reviewNote}
        </p>
      ) : null}
      {application.status === 'APPROVED' && application.storeUsername ? (
        <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {t('merchant_app_store_login', { username: application.storeUsername })}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t('merchant_app_owner')}>
          <Item label={t('full_name')} value={`${owner.firstName} ${owner.lastName}`} />
          <Item label={t('Email')} value={owner.email} />
          <Item label={t('Phone')} value={owner.phone} />
        </Card>

        <Card title={t('merchant_app_store')}>
          <div className="flex gap-3">
            <Thumb url={store.logo} label={t('merchant_app_logo')} />
            <Thumb url={store.coverImage} label={t('merchant_app_cover')} />
          </div>
          <Item label={t('merchant_app_shop_type')} value={store.shopType?.name} />
          <Item label={t('merchant_app_categories')} value={store.cuisines?.join(', ')} />
          <Item label={t('Phone')} value={store.phone} />
        </Card>

        <Card title={t('merchant_app_location')}>
          <Item label={t('Address')} value={store.address} />
          <Item label={t('merchant_app_city')} value={[store.city, store.postCode].filter(Boolean).join(' ')} />
          <Item label={t('Zone')} value={store.zone?.name} />
          {store.location ? (
            <a
              className="text-sm text-primary-color underline"
              href={`https://www.google.com/maps?q=${store.location.latitude},${store.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('merchant_app_view_map')}
            </a>
          ) : null}
        </Card>

        <Card title={t('merchant_app_business')}>
          <Item label={t('merchant_app_legal_name')} value={business.legalName} />
          <Item label={t('merchant_app_registration')} value={business.registrationNumber} />
          <Item label={t('merchant_app_tax_id')} value={business.taxId} />
          <div className="flex gap-3">
            <Thumb url={business.ownerIdUrl} label={t('merchant_app_owner_id')} />
            <Thumb url={business.businessLicenseUrl} label={t('merchant_app_license')} />
          </div>
        </Card>

        <Card title={t('merchant_app_payout')}>
          <Item label={t('merchant_app_bank')} value={bank?.bankName} />
          <Item label={t('merchant_app_account_holder')} value={bank?.accountHolder} />
          <Item label={t('merchant_app_account_number')} value={bank?.accountNumber} />
          <Item label={t('merchant_app_routing')} value={bank?.routingCode} />
        </Card>

        <Card title={t('merchant_app_hours')}>
          {hours.length ? (
            <ul className="grid gap-1 text-sm">
              {hours.map((day) => (
                <li key={day.day} className="flex justify-between">
                  <span>{day.day}</span>
                  <span className="font-medium">
                    {day.times?.length
                      ? day.times.map((time) => `${time.startTime.join(':')}–${time.endTime.join(':')}`).join(', ')
                      : t('merchant_app_closed')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <span>-</span>
          )}
        </Card>

        <Card title={t('merchant_app_menu')}>
          {store.menuPhotos?.length ? (
            <div className="flex flex-wrap gap-3">
              {store.menuPhotos.map((url, index) => (
                <Thumb key={url} url={url} label={`${index + 1}`} />
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">{t('merchant_app_no_menu')}</span>
          )}
          {store.notes ? <Item label={t('merchant_app_notes')} value={store.notes} /> : null}
        </Card>

        <Card title={t('merchant_app_history')}>
          <ul className="grid gap-2 text-sm">
            {(application.history ?? []).map((entry, index) => (
              <li key={index} className="flex flex-col">
                <span className="font-medium">
                  {t(`merchant_app_status_${entry.status.toLowerCase()}`)}
                  {entry.at ? ` · ${new Date(entry.at).toLocaleString()}` : ''}
                </span>
                {entry.note ? <span className="text-gray-500">{entry.note}</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Dialog
        header={t('merchant_app_approve_title')}
        visible={dialog === 'approve'}
        onHide={closeDialog}
        className="w-[95vw] max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('merchant_app_approve_intro')}</p>
          <ul className="flex flex-col gap-2 text-sm">
            {['account', 'store', 'email', 'hidden'].map((step) => (
              <li key={step} className="flex items-start gap-2">
                <i className="pi pi-check-circle mt-0.5 text-green-600" />
                {t(`merchant_app_approve_step_${step}`)}
              </li>
            ))}
          </ul>
          <Field
            label={t('merchant_app_delivery_radius')}
            hint={t('merchant_app_delivery_radius_hint')}
            htmlFor="delivery-radius"
          >
            <NumberInput
              id="delivery-radius"
              value={radius}
              min={0.5}
              max={50}
              step={0.5}
              suffix="km"
              onValueChange={(v) => setRadius(Math.min(50, Math.max(0.5, v)))}
            />
          </Field>
          <DialogActions>
            <ActionButton variant="secondary" onClick={closeDialog} disabled={approving}>
              {t('Cancel')}
            </ActionButton>
            <ActionButton
              variant="success"
              icon="pi pi-check"
              loading={approving}
              onClick={() => approve({ variables: { id: application._id, deliveryRadiusKm: radius } })}
            >
              {t('merchant_app_approve_confirm')}
            </ActionButton>
          </DialogActions>
        </div>
      </Dialog>

      <Dialog
        header={t('merchant_app_request_changes')}
        visible={dialog === 'changes'}
        onHide={closeDialog}
        className="w-[95vw] max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <Callout tone="info">{t('merchant_app_changes_body')}</Callout>
          <Field label={t('merchant_app_changes_label')} required htmlFor="changes-note">
            <TextArea
              id="changes-note"
              rows={5}
              value={note}
              maxLength={1000}
              placeholder={t('merchant_app_changes_placeholder')}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <DialogActions>
            <ActionButton variant="secondary" onClick={closeDialog} disabled={requesting}>
              {t('Cancel')}
            </ActionButton>
            <ActionButton
              icon="pi pi-send"
              loading={requesting}
              disabled={!note.trim()}
              onClick={() => requestChanges({ variables: { id: application._id, note: note.trim() } })}
            >
              {t('merchant_app_send_to_applicant')}
            </ActionButton>
          </DialogActions>
        </div>
      </Dialog>

      <Dialog
        header={t('merchant_app_reject_title')}
        visible={dialog === 'reject'}
        onHide={closeDialog}
        className="w-[95vw] max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <Callout tone="danger">{t('merchant_app_reject_body')}</Callout>
          <Field label={t('merchant_app_reject_reason')} required htmlFor="reject-reason" hint={t('merchant_app_reject_reason_hint')}>
            <TextArea
              id="reject-reason"
              rows={5}
              value={note}
              maxLength={1000}
              placeholder={t('merchant_app_reject_placeholder')}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <DialogActions>
            <ActionButton variant="secondary" onClick={closeDialog} disabled={rejecting}>
              {t('Cancel')}
            </ActionButton>
            <ActionButton
              variant="danger"
              icon="pi pi-times"
              loading={rejecting}
              disabled={!note.trim()}
              onClick={() => reject({ variables: { id: application._id, reason: note.trim() } })}
            >
              {t('merchant_app_reject_confirm')}
            </ActionButton>
          </DialogActions>
        </div>
      </Dialog>
    </div>
  );
}
