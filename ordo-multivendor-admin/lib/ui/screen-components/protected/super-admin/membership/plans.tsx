'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { Sidebar } from 'primereact/sidebar';
import { useEffect, useRef, useState } from 'react';

import {
  CREATE_MEMBERSHIP_PLAN,
  GET_MEMBERSHIP_PLANS,
  UPDATE_MEMBERSHIP_PLAN,
} from '@/lib/api/graphql';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import useToast from '@/lib/hooks/useToast';
import ActionMenu from '@/lib/ui/useable-components/action-menu';
import {
  ActionButton,
  Callout,
  Field,
  FormSection,
  NumberInput,
  Select,
  SwitchRow,
  TextInput,
} from '@/lib/ui/useable-components/admin-form';
import CustomInputSwitch from '@/lib/ui/useable-components/custom-input-switch';
import Table from '@/lib/ui/useable-components/table';
import {
  IMembershipBenefits,
  IMembershipPlan,
  TMembershipInterval,
} from '@/lib/utils/interfaces';

import MembershipProgramStatus from './program-status';
import { benefitsSummary, errorMessage, money, planPrice } from './shared';

type PlanForm = Omit<IMembershipPlan, '_id'> & { _id?: string };
const EMPTY: PlanForm = {
  name: '',
  price: 0,
  interval: 'month',
  intervalCount: 1,
  badge: '',
  isActive: true,
  sortOrder: 0,
  freeDelivery: true,
  orderDiscountPercent: 0,
  maxOrderDiscount: 0,
};
const INTERVALS: TMembershipInterval[] = ['day', 'week', 'month', 'year'];
// order total used for the "a member saves..." example
const EXAMPLE_ORDER = 1000;

const exampleSaving = (b: IMembershipBenefits) => {
  if (!(b.orderDiscountPercent > 0)) return 0;
  const raw = Math.round(EXAMPLE_ORDER * b.orderDiscountPercent) / 100;
  return b.maxOrderDiscount > 0 ? Math.min(raw, b.maxOrderDiscount) : raw;
};

const toInput = (plan: PlanForm) => ({
  name: plan.name.trim(),
  price: Math.max(0, plan.price || 0),
  interval: plan.interval,
  intervalCount: Math.max(1, Math.round(plan.intervalCount || 1)),
  badge: plan.badge?.trim() || null,
  isActive: plan.isActive,
  sortOrder: Math.round(plan.sortOrder ?? 0),
  freeDelivery: plan.freeDelivery,
  orderDiscountPercent: Math.min(
    100,
    Math.max(0, plan.orderDiscountPercent || 0)
  ),
  maxOrderDiscount:
    plan.orderDiscountPercent > 0 ? Math.max(0, plan.maxOrderDiscount || 0) : 0,
});

export default function MembershipPlans({
  addRequest,
}: {
  addRequest: number;
}) {
  const t = useTranslations();
  const { showToast } = useToast();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const [editing, setEditing] = useState<PlanForm | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{
    membershipPlans: IMembershipPlan[];
  }>(GET_MEMBERSHIP_PLANS, {
    fetchPolicy: 'cache-and-network',
  });
  const plans = data?.membershipPlans ?? [];

  // header "Add plan" button
  const seenRequest = useRef(addRequest);
  useEffect(() => {
    if (addRequest === seenRequest.current) return;
    seenRequest.current = addRequest;
    setEditing({ ...EMPTY, sortOrder: plans.length + 1 });
  }, [addRequest, plans.length]);

  const onError = (error: unknown) =>
    showToast({
      type: 'error',
      title: t('Error'),
      message: errorMessage(error, t('membership_save_failed')),
    });
  const onSaved = () => {
    setEditing(null);
    refetch();
    showToast({
      type: 'success',
      title: t('Success'),
      message: t('membership_plan_saved'),
    });
  };
  const [createPlan, { loading: creating }] = useMutation(
    CREATE_MEMBERSHIP_PLAN,
    { onCompleted: onSaved, onError }
  );
  const [updatePlan, { loading: updating }] = useMutation(
    UPDATE_MEMBERSHIP_PLAN,
    { onCompleted: onSaved, onError }
  );
  const [toggleVisible] = useMutation(UPDATE_MEMBERSHIP_PLAN, { onError });

  const set = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) =>
    editing && setEditing({ ...editing, [key]: value });
  const hasBenefit =
    !!editing && (editing.freeDelivery || editing.orderDiscountPercent > 0);

  const submit = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: t('membership_plan_name_required'),
      });
      return;
    }
    if (!hasBenefit) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: t('membership_benefit_required'),
      });
      return;
    }
    if (editing._id)
      updatePlan({ variables: { id: editing._id, input: toInput(editing) } });
    else createPlan({ variables: { input: toInput(editing) } });
  };

  const setVisible = async (plan: IMembershipPlan) => {
    setToggling(plan._id);
    await toggleVisible({
      variables: {
        id: plan._id,
        input: toInput({ ...plan, isActive: !plan.isActive }),
      },
    });
    setToggling(null);
  };

  const menuItems = [
    {
      label: t('Edit'),
      command: (plan?: IMembershipPlan) => plan && setEditing({ ...plan }),
    },
  ];

  const columns = [
    {
      headerName: t('Name'),
      propertyName: 'name',
      body: (row: IMembershipPlan) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.name}</span>
          {row.badge ? (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {row.badge}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      headerName: t('membership_price'),
      propertyName: 'price',
      body: (row: IMembershipPlan) => planPrice(t, CURRENCY_SYMBOL, row),
    },
    {
      headerName: t('membership_benefits'),
      propertyName: 'freeDelivery',
      body: (row: IMembershipPlan) => benefitsSummary(t, CURRENCY_SYMBOL, row),
    },
    {
      headerName: t('membership_plan_visible'),
      propertyName: 'isActive',
      body: (row: IMembershipPlan) => (
        <div
          className="flex w-full items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <CustomInputSwitch
            isActive={row.isActive}
            loading={toggling === row._id}
            onChange={() => setVisible(row)}
          />
          <ActionMenu data={row} items={menuItems} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        data={plans}
        columns={columns}
        loading={loading && !plans.length}
        moduleName="Membership-Plans"
        handleRowClick={(event) =>
          setEditing({ ...(event.data as IMembershipPlan) })
        }
        header={
          <>
            <MembershipProgramStatus />
            <p className="mb-3 text-sm text-gray-500">
              {t('membership_plans_intro')}
            </p>
          </>
        }
      />

      <Sidebar
        visible={!!editing}
        onHide={() => setEditing(null)}
        position="right"
        className="w-full border sm:w-[480px] dark:border-dark-600 dark:bg-dark-950 dark:text-white"
      >
        {editing ? (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold">
              {editing._id
                ? t('membership_edit_plan_named', { name: editing.name })
                : t('membership_add_plan')}
            </h2>

            {editing._id ? (
              <Callout tone="warning">{t('membership_plan_edit_note')}</Callout>
            ) : null}

            <FormSection
              step={1}
              title={t('membership_section_price')}
              description={t('membership_section_price_hint')}
            >
              <Field
                label={t('membership_plan_name')}
                required
                htmlFor="plan-name"
                hint={t('membership_plan_name_hint')}
              >
                <TextInput
                  id="plan-name"
                  value={editing.name}
                  maxLength={60}
                  placeholder={t('membership_plan_name_placeholder')}
                  onChange={(e) => set('name', e.target.value)}
                />
              </Field>
              <Field
                label={t('membership_price')}
                required
                htmlFor="plan-price"
              >
                <NumberInput
                  id="plan-price"
                  value={editing.price}
                  min={0}
                  prefix={CURRENCY_SYMBOL}
                  onValueChange={(v) => set('price', Math.max(0, v))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={t('membership_billed_every')}
                  htmlFor="plan-count"
                >
                  <NumberInput
                    id="plan-count"
                    value={editing.intervalCount}
                    min={1}
                    max={24}
                    step={1}
                    onValueChange={(v) =>
                      set('intervalCount', Math.max(1, Math.round(v)))
                    }
                  />
                </Field>
                <Field label={t('membership_period')} htmlFor="plan-interval">
                  <Select
                    id="plan-interval"
                    value={editing.interval}
                    onChange={(e) =>
                      set('interval', e.target.value as TMembershipInterval)
                    }
                    options={INTERVALS.map((value) => ({
                      value,
                      label: t(`membership_unit_${value}`, {
                        count: editing.intervalCount || 1,
                      }),
                    }))}
                  />
                </Field>
              </div>
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-dark-800 dark:text-gray-200">
                {t('membership_price_sentence', {
                  price: money(CURRENCY_SYMBOL, editing.price || 0),
                  period: t(`membership_per_${editing.interval}`, {
                    count: editing.intervalCount || 1,
                  }),
                })}
              </p>
            </FormSection>

            <FormSection
              step={2}
              title={t('membership_section_benefits')}
              description={t('membership_section_benefits_hint')}
            >
              <SwitchRow
                title={t('membership_benefit_free_delivery')}
                description={t('membership_free_delivery_hint')}
                checked={editing.freeDelivery}
                onChange={(on) => set('freeDelivery', on)}
              />
              <Field
                label={t('membership_percent_off')}
                hint={t('membership_percent_off_hint')}
                htmlFor="plan-percent"
              >
                <NumberInput
                  id="plan-percent"
                  value={editing.orderDiscountPercent}
                  min={0}
                  max={100}
                  suffix="%"
                  onValueChange={(v) =>
                    set('orderDiscountPercent', Math.min(100, Math.max(0, v)))
                  }
                />
              </Field>
              <Field
                label={t('membership_max_discount')}
                hint={t('membership_max_discount_hint')}
                htmlFor="plan-max"
              >
                <NumberInput
                  id="plan-max"
                  value={editing.maxOrderDiscount}
                  min={0}
                  prefix={CURRENCY_SYMBOL}
                  disabled={!(editing.orderDiscountPercent > 0)}
                  onValueChange={(v) => set('maxOrderDiscount', Math.max(0, v))}
                />
              </Field>
              {hasBenefit ? (
                <Callout tone="success">
                  {t('membership_example_saving', {
                    order: money(CURRENCY_SYMBOL, EXAMPLE_ORDER),
                    saving: money(CURRENCY_SYMBOL, exampleSaving(editing)),
                  })}
                  {editing.freeDelivery
                    ? ` ${t('membership_example_plus_delivery')}`
                    : ''}
                </Callout>
              ) : (
                <Callout tone="danger">
                  {t('membership_benefit_required')}
                </Callout>
              )}
            </FormSection>

            <FormSection
              step={3}
              title={t('membership_section_website')}
              description={t('membership_section_website_hint')}
            >
              <SwitchRow
                title={t('membership_plan_visible')}
                description={
                  editing.isActive
                    ? t('membership_plan_visible_on')
                    : t('membership_plan_visible_off')
                }
                checked={editing.isActive}
                onChange={(on) => set('isActive', on)}
              />
              <Field
                label={t('membership_badge')}
                hint={t('membership_badge_hint')}
                htmlFor="plan-badge"
              >
                <TextInput
                  id="plan-badge"
                  value={editing.badge ?? ''}
                  maxLength={24}
                  placeholder={t('membership_badge_placeholder')}
                  onChange={(e) => set('badge', e.target.value)}
                />
              </Field>
              <Field
                label={t('membership_sort_order')}
                hint={t('membership_sort_order_hint')}
                htmlFor="plan-sort"
              >
                <NumberInput
                  id="plan-sort"
                  value={editing.sortOrder ?? 0}
                  step={1}
                  onValueChange={(v) => set('sortOrder', Math.round(v))}
                />
              </Field>
            </FormSection>

            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-dark-600">
              <ActionButton
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                {t('Cancel')}
              </ActionButton>
              <ActionButton
                loading={creating || updating}
                disabled={!hasBenefit}
                onClick={submit}
              >
                {editing._id
                  ? t('membership_save_changes')
                  : t('membership_create_plan')}
              </ActionButton>
            </div>
          </div>
        ) : null}
      </Sidebar>
    </>
  );
}
