'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';

import { GET_MEMBERSHIP_SETTINGS, UPDATE_MEMBERSHIP_SETTINGS } from '@/lib/api/graphql';
import useToast from '@/lib/hooks/useToast';
import { ActionButton, Callout, DialogActions, Switch } from '@/lib/ui/useable-components/admin-form';
import { IMembershipSettings } from '@/lib/utils/interfaces';

import { errorMessage } from './shared';

// The program's master switch, shown above the plans so it's clear why plans
// do or don't appear in the app and on the website. Saves immediately.
export default function MembershipProgramStatus() {
  const t = useTranslations();
  const { showToast } = useToast();
  const [confirmOff, setConfirmOff] = useState(false);

  const { data } = useQuery<{ membershipSettings: IMembershipSettings }>(GET_MEMBERSHIP_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
  const enabled = !!data?.membershipSettings?.enabled;

  const [update, { loading }] = useMutation(UPDATE_MEMBERSHIP_SETTINGS, {
    refetchQueries: [{ query: GET_MEMBERSHIP_SETTINGS }],
    onCompleted: (result) =>
      showToast({
        type: 'success',
        title: t('Success'),
        message: result.updateMembershipSettings.enabled ? t('membership_program_turned_on') : t('membership_program_turned_off'),
      }),
    onError: (error) =>
      showToast({ type: 'error', title: t('Error'), message: errorMessage(error, t('membership_save_failed')) }),
  });
  const setEnabled = (on: boolean) => update({ variables: { input: { enabled: on } } });

  if (!data) return null;

  return (
    <>
      <div
        className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
          enabled
            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
            : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
        }`}
      >
        <div className="flex items-start gap-3">
          <i
            className={`pi ${enabled ? 'pi-check-circle text-green-600' : 'pi-eye-slash text-amber-600'} mt-0.5 text-lg`}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {enabled ? t('membership_status_bar_on') : t('membership_status_bar_off')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {enabled ? t('membership_status_bar_on_hint') : t('membership_status_bar_off_hint')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{enabled ? t('Enabled') : t('Disabled')}</span>
          <Switch
            checked={enabled}
            disabled={loading}
            label={t('membership_program_switch')}
            onChange={(on) => (on ? setEnabled(true) : setConfirmOff(true))}
          />
        </div>
      </div>

      <Dialog
        visible={confirmOff}
        onHide={() => setConfirmOff(false)}
        header={t('membership_turn_off_title')}
        className="w-[95vw] max-w-md"
      >
        <div className="flex flex-col gap-3">
          <Callout tone="warning">{t('membership_turn_off_body')}</Callout>
          <DialogActions>
            <ActionButton variant="secondary" onClick={() => setConfirmOff(false)}>
              {t('Cancel')}
            </ActionButton>
            <ActionButton
              variant="danger"
              loading={loading}
              onClick={() => {
                setEnabled(false);
                setConfirmOff(false);
              }}
            >
              {t('membership_turn_off_confirm')}
            </ActionButton>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
}
