'use client';
import { useTranslations } from 'next-intl';
import { ITierForm } from '@/lib/utils/interfaces';
import { useLoyaltyContext } from '@/lib/hooks/useLoyalty';
import { Form, Formik } from 'formik';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';
import CustomNumberField from '@/lib/ui/useable-components/number-input-field';
import { TierSchema } from '@/lib/utils/schema/tier';
import { useEffect, useState } from 'react';
import useToast from '@/lib/hooks/useToast';
import {
  FetchLoyaltyTiersByUserTypeDocument,
  useCreateLoyaltyTierMutation,
  useEditLoyaltyTierMutation,
  useFetchLoyaltyTierByIdLazyQuery,
} from '@/lib/graphql-generated';

const initialData: ITierForm = {
  name: '',
  points: 0,
  requiredDirectDownlines: 0,
  weeklyOrderQuota: null,
};

export default function TierForm() {
  const t = useTranslations();
  const { tierFormVisible, setTierFormVisible, loyaltyData, setLoyaltyData, loyaltyType } =
    useLoyaltyContext();
  const { showToast } = useToast();
  const isRider = loyaltyType === 'Rider Loyalty Program';

  const [initialValues, setInitialValues] = useState<ITierForm>(initialData);

  const [fetchLoyaltyTierById, { loading }] = useFetchLoyaltyTierByIdLazyQuery();
  const [createLoyaltyTier, { loading: creating }] = useCreateLoyaltyTierMutation();
  const [updateLoyaltyTier, { loading: updating }] = useEditLoyaltyTierMutation();

  const onHide = () => {
    setTierFormVisible(false);
    setLoyaltyData({ tierId: '' });
  };

  useEffect(() => {
    if (!loyaltyData?.tierId) {
      setInitialValues(initialData);
      return;
    }
    fetchLoyaltyTierById({ variables: { id: loyaltyData.tierId } }).then(({ data }) => {
      const tier = data?.fetchLoyaltyTierById;
      if (!tier) return;
      setInitialValues({
        name: tier.name,
        points: tier.points ?? 0,
        requiredDirectDownlines: tier.requiredDirectDownlines ?? 0,
        weeklyOrderQuota: tier.weeklyOrderQuota ?? null,
      });
    });
  }, [loyaltyData?.tierId]);

  const onHandleSubmit = async (values: ITierForm) => {
    try {
      const input = {
        name: values.name.trim().toLowerCase(),
        userType: isRider ? 'driver' : 'customer',
        points: isRider ? 0 : values.points,
        requiredDirectDownlines: values.requiredDirectDownlines,
        weeklyOrderQuota: values.weeklyOrderQuota,
      };
      const refetch = [{ query: FetchLoyaltyTiersByUserTypeDocument, variables: { userType: isRider ? 'driver' : 'customer' } }];

      if (loyaltyData?.tierId) {
        await updateLoyaltyTier({
          variables: { id: loyaltyData.tierId, input },
          refetchQueries: refetch,
        });
      } else {
        await createLoyaltyTier({
          variables: { input },
          refetchQueries: refetch,
        });
      }
      onHide();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed.',
        message: (err as Error)?.message || 'Please try again later',
      });
    }
  };

  return (
    <Sidebar
      visible={tierFormVisible}
      onHide={onHide}
      position="right"
      className="w-full sm:w-[450px] dark:bg-dark-950 dark:text-white"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground dark:text-white">
          {loyaltyData?.tierId ? 'Edit' : 'Create'} {isRider ? 'Rider Success Level' : 'Tier'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRider
            ? 'Set the level name, required direct downlines to reach it, and weekly delivery quota to unlock residual income.'
            : 'Set the tier name, points threshold, required direct downlines, and weekly order quota.'}
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={TierSchema}
        onSubmit={onHandleSubmit}
        enableReinitialize
        validateOnChange
      >
        {({ values, errors, setFieldValue, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tier Name */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                  Tier Name
                </label>
                <input
                  type="text"
                  value={values.name}
                  onChange={(e) => setFieldValue('name', e.target.value)}
                  placeholder="e.g. bronze, silver, diamond, elite"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ borderColor: errors.name ? 'red' : '' }}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              {/* Points Threshold — only relevant for customers */}
              {!isRider && (
                <CustomNumberField
                  min={0}
                  max={9999999}
                  placeholder="Points threshold to reach this tier"
                  name="points"
                  showLabel={true}
                  value={values.points}
                  onChange={setFieldValue}
                  isLoading={loading}
                  style={{ borderColor: errors.points ? 'red' : '' }}
                />
              )}

              {/* Required Direct Downlines */}
              <CustomNumberField
                min={0}
                max={9999}
                placeholder={isRider ? 'Required direct downlines to reach this level' : 'Required direct downlines (0 = no requirement)'}
                name="requiredDirectDownlines"
                showLabel={true}
                value={values.requiredDirectDownlines}
                onChange={setFieldValue}
                isLoading={loading}
                style={{ borderColor: errors.requiredDirectDownlines ? 'red' : '' }}
              />

              {/* Weekly Quota */}
              <CustomNumberField
                min={0}
                max={9999}
                placeholder={isRider ? 'Weekly deliveries required to unlock residual income' : 'Weekly order quota (leave 0 if not applicable)'}
                name="weeklyOrderQuota"
                showLabel={true}
                value={values.weeklyOrderQuota ?? 0}
                onChange={(name: string, val: number | null) =>
                  setFieldValue(name, val === 0 ? null : val)
                }
                isLoading={loading}
              />
              <p className="text-xs text-muted-foreground -mt-2">
                {isRider
                  ? 'Riders must complete this many deliveries per week to have their residual income released.'
                  : 'Reduced weekly order quota required to earn residual points at this tier.'}
              </p>

              <button
                className="float-end h-10 w-fit rounded-md bg-gray-800 px-8 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting || creating || updating ? (
                  <ProgressSpinner
                    className="m-0 h-6 w-6 items-center self-center p-0"
                    strokeWidth="5"
                    style={{ fill: 'white', accentColor: 'white' }}
                    color="white"
                  />
                ) : loyaltyData?.tierId ? (
                  t('Update')
                ) : (
                  t('Add')
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Sidebar>
  );
}
