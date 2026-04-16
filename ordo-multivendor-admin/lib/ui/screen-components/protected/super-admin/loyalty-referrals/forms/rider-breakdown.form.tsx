'use client';
import { useTranslations } from 'next-intl';
import { Form, Formik } from 'formik';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';
import { useEffect, useState } from 'react';

import { IRiderBreakdownForm } from '@/lib/utils/interfaces/forms/loyalty.form.interface';
import { RiderBreakdownSchema } from '@/lib/utils/schema/breakdown';
import { useLoyaltyContext } from '@/lib/hooks/useLoyalty';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import useToast from '@/lib/hooks/useToast';
import CustomNumberField from '@/lib/ui/useable-components/number-input-field';
import {
  FetchRiderLoyaltyBreakdownsDocument,
  useCreateRiderLoyaltyBreakdownMutation,
  useEditRiderLoyaltyBreakdownMutation,
  useFetchRiderLoyaltyBreakdownByIdLazyQuery,
} from '@/lib/graphql-generated';

const initialData: IRiderBreakdownForm = { min: 0, max: 1, amount: 0 };

export default function RiderBreakdownForm() {
  const t = useTranslations();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const { loyaltyData, setLoyaltyData, riderBreakdownFormVisible, setRiderBreakdownFormVisible } =
    useLoyaltyContext();
  const { showToast } = useToast();

  const [initialValues, setInitialValues] = useState<IRiderBreakdownForm>(initialData);

  const [fetchById, { loading }] = useFetchRiderLoyaltyBreakdownByIdLazyQuery();
  const [create, { loading: creating }] = useCreateRiderLoyaltyBreakdownMutation();
  const [update, { loading: updating }] = useEditRiderLoyaltyBreakdownMutation();

  const onHide = () => {
    setRiderBreakdownFormVisible(false);
    setLoyaltyData({ riderBreakdownId: '' });
  };

  useEffect(() => {
    const { riderBreakdownId } = loyaltyData || {};
    if (!riderBreakdownId) return;

    fetchById({ variables: { id: riderBreakdownId } }).then(({ data }) => {
      const bd = data?.fetchRiderLoyaltyBreakdownById;
      if (bd) setInitialValues({ min: bd.min, max: bd.max, amount: bd.amount });
    });
  }, [loyaltyData?.riderBreakdownId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onHandleSubmit = async (values: IRiderBreakdownForm) => {
    try {
      const { riderBreakdownId } = loyaltyData || {};
      const refetch = [{ query: FetchRiderLoyaltyBreakdownsDocument }];

      if (riderBreakdownId) {
        await update({ variables: { id: riderBreakdownId, input: values }, refetchQueries: refetch });
      } else {
        await create({ variables: { input: values }, refetchQueries: refetch });
      }
      onHide();
    } catch (err) {
      showToast({ type: 'error', title: 'Failed.', message: (err as Error)?.message || 'Please try again later' });
    }
  };

  return (
    <Sidebar
      visible={riderBreakdownFormVisible}
      onHide={onHide}
      position="right"
      className="w-full sm:w-[450px] dark:bg-dark-950 dark:text-white"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={RiderBreakdownSchema}
        onSubmit={onHandleSubmit}
        validateOnChange
        enableReinitialize
      >
        {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <CustomNumberField
                prefix={CURRENCY_SYMBOL + ' '}
                min={0}
                max={999999}
                placeholder={`Min delivery earnings (${CURRENCY_SYMBOL})`}
                name="min"
                showLabel
                value={values.min}
                onChange={setFieldValue}
                isLoading={loading}
              />
              <CustomNumberField
                prefix={CURRENCY_SYMBOL + ' '}
                min={0}
                max={999999}
                placeholder={`Max delivery earnings (${CURRENCY_SYMBOL})`}
                name="max"
                showLabel
                value={values.max}
                onChange={setFieldValue}
                isLoading={loading}
              />
              <CustomNumberField
                prefix={CURRENCY_SYMBOL + ' '}
                min={0}
                max={999999}
                placeholder={`Reward amount (${CURRENCY_SYMBOL})`}
                name="amount"
                showLabel
                value={values.amount}
                onChange={setFieldValue}
                isLoading={loading}
              />
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
                ) : loyaltyData?.riderBreakdownId ? t('Update') : t('Add')}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Sidebar>
  );
}
