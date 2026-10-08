'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { Dialog } from 'primereact/dialog';
import { Skeleton } from 'primereact/skeleton';
import { useEffect, useMemo, useState } from 'react';

import {
  GET_MEMBERSHIP_SETTINGS,
  UPDATE_MEMBERSHIP_SETTINGS,
} from '@/lib/api/graphql';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import useToast from '@/lib/hooks/useToast';
import {
  ActionButton,
  Callout,
  DialogActions,
  Field,
  FormSection,
  NumberInput,
  TextArea,
  TextInput,
} from '@/lib/ui/useable-components/admin-form';
import { IMembershipSettings } from '@/lib/utils/interfaces';
import ConfigCard from '@/lib/ui/screen-components/protected/super-admin/configuration/view/card';

import { errorMessage, money } from './shared';

type Form = Omit<IMembershipSettings, 'perks'> & { perksText: string };

const toForm = (s: IMembershipSettings): Form => ({
  enabled: s.enabled,
  name: s.name,
  tagline: s.tagline ?? '',
  freeDeliveryMinOrder: s.freeDeliveryMinOrder ?? 0,
  trialDays: s.trialDays ?? 0,
  perksText: (s.perks ?? []).join('\n'),
});
const perksOf = (text: string) =>
  text
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

export default function MembershipSettingsForm() {
  const t = useTranslations();
  const { showToast } = useToast();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const { data, loading } = useQuery<{
    membershipSettings: IMembershipSettings;
  }>(GET_MEMBERSHIP_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);

  useEffect(() => {
    if (data?.membershipSettings && !saved) {
      setSaved(toForm(data.membershipSettings));
      setForm(toForm(data.membershipSettings));
    }
  }, [data, saved]);

  const dirty = useMemo(
    () => !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved]
  );

  const [save, { loading: saving }] = useMutation(UPDATE_MEMBERSHIP_SETTINGS, {
    onCompleted: (result) => {
      const next = toForm(result.updateMembershipSettings);
      setSaved(next);
      setForm(next);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('membership_settings_saved'),
      });
    },
    onError: (error) =>
      showToast({
        type: 'error',
        title: t('Error'),
        message: errorMessage(error, t('membership_save_failed')),
      }),
  });

  if (!form || !saved) return loading ? <Skeleton height="24rem" /> : null;
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm({ ...form, [key]: value });

  const submit = () => {
    if (!form.name.trim()) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: t('membership_name_required'),
      });
      return;
    }
    save({
      variables: {
        input: {
          enabled: form.enabled,
          name: form.name.trim(),
          tagline: form.tagline?.trim() ?? '',
          perks: perksOf(form.perksText),
          freeDeliveryMinOrder: Math.max(0, form.freeDeliveryMinOrder || 0),
          trialDays: Math.max(0, Math.round(form.trialDays || 0)),
        },
      },
    });
  };

  const toggleEnabled = (on: boolean) =>
    on ? set('enabled', true) : setConfirmOff(true);
  const perks = perksOf(form.perksText);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <ConfigCard
        cardTitle={t('membership_program_switch')}
        toggleLabel={form.enabled ? t('Enabled') : t('Disabled')}
        toggleValue={form.enabled}
        toggleOnChange={() => toggleEnabled(!form.enabled)}
        buttonLoading={saving}
      >
        <div className="flex flex-col gap-8">
          <Callout tone={form.enabled ? 'success' : 'warning'}>
            <b>
              {form.enabled
                ? t('membership_program_live')
                : t('membership_program_off')}
            </b>
            <span className="block text-xs opacity-80">
              {t('membership_program_switch_hint')}
            </span>
          </Callout>

          <FormSection
            step={1}
            title={t('membership_section_display')}
            description={t('membership_section_display_hint')}
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_260px]">
              <div className="flex flex-col gap-4">
                <Field
                  label={t('membership_program_name')}
                  hint={t('membership_program_name_hint')}
                  required
                  htmlFor="ms-name"
                >
                  <TextInput
                    id="ms-name"
                    value={form.name}
                    maxLength={60}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </Field>
                <Field
                  label={t('membership_tagline')}
                  hint={t('membership_tagline_hint')}
                  htmlFor="ms-tagline"
                >
                  <TextInput
                    id="ms-tagline"
                    value={form.tagline ?? ''}
                    maxLength={120}
                    placeholder={t('membership_tagline_placeholder')}
                    onChange={(e) => set('tagline', e.target.value)}
                  />
                </Field>
                <Field
                  label={t('membership_perks')}
                  hint={t('membership_perks_hint')}
                  htmlFor="ms-perks"
                >
                  <TextArea
                    id="ms-perks"
                    rows={4}
                    value={form.perksText}
                    placeholder={t('membership_perks_placeholder')}
                    onChange={(e) => set('perksText', e.target.value)}
                  />
                </Field>
              </div>

              {/* how the top of /membership will look */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('membership_preview')}
                </span>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center dark:border-dark-600 dark:bg-dark-900">
                  <i className="pi pi-crown text-2xl text-primary-color" />
                  <p className="mt-2 text-xl font-bold text-primary-color">
                    {form.name || t('membership_program_name')}
                  </p>
                  {form.tagline ? (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {form.tagline}
                    </p>
                  ) : null}
                  {perks.length ? (
                    <ul className="mt-3 grid gap-1 text-start text-sm">
                      {perks.map((perk) => (
                        <li key={perk} className="flex gap-2">
                          <i className="pi pi-check mt-1 text-xs text-green-600" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-3 text-xs text-gray-400">
                    {t('membership_preview_plans_below')}
                  </p>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            step={2}
            title={t('membership_section_rules')}
            description={t('membership_section_rules_hint')}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label={t('membership_min_order')}
                htmlFor="ms-min"
                hint={
                  form.freeDeliveryMinOrder > 0
                    ? t('membership_min_order_sentence', {
                        amount: money(
                          CURRENCY_SYMBOL,
                          form.freeDeliveryMinOrder
                        ),
                      })
                    : t('membership_min_order_sentence_any')
                }
              >
                <NumberInput
                  id="ms-min"
                  value={form.freeDeliveryMinOrder}
                  min={0}
                  prefix={CURRENCY_SYMBOL}
                  onValueChange={(v) =>
                    set('freeDeliveryMinOrder', Math.max(0, v))
                  }
                />
              </Field>
              <Field
                label={t('membership_trial_days')}
                htmlFor="ms-trial"
                hint={
                  form.trialDays > 0
                    ? t('membership_trial_sentence', { days: form.trialDays })
                    : t('membership_trial_sentence_off')
                }
              >
                <NumberInput
                  id="ms-trial"
                  value={form.trialDays}
                  min={0}
                  max={365}
                  step={1}
                  suffix={t('membership_days_unit')}
                  onValueChange={(v) =>
                    set('trialDays', Math.max(0, Math.round(v)))
                  }
                />
              </Field>
            </div>
            <Callout tone="info">
              {t('membership_benefits_live_in_plans')}
            </Callout>
          </FormSection>

          {dirty ? (
            <p className="flex items-center gap-2 text-sm font-medium text-orange-700">
              <i className="pi pi-pencil" />
              {t('membership_unsaved_changes')}
              <button
                type="button"
                className="text-gray-500 underline"
                onClick={() => setForm(saved)}
              >
                {t('membership_discard')}
              </button>
            </p>
          ) : null}
        </div>
      </ConfigCard>

      <Dialog
        visible={confirmOff}
        onHide={() => setConfirmOff(false)}
        header={t('membership_turn_off_title')}
        className="w-[95vw] max-w-md"
      >
        <div className="flex flex-col gap-3">
          <Callout tone="warning">{t('membership_turn_off_body')}</Callout>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('membership_turn_off_save_note')}
          </p>
          <DialogActions>
            <ActionButton
              variant="secondary"
              onClick={() => setConfirmOff(false)}
            >
              {t('Cancel')}
            </ActionButton>
            <ActionButton
              variant="danger"
              onClick={() => {
                set('enabled', false);
                setConfirmOff(false);
              }}
            >
              {t('membership_turn_off_confirm')}
            </ActionButton>
          </DialogActions>
        </div>
      </Dialog>
    </form>
  );
}
