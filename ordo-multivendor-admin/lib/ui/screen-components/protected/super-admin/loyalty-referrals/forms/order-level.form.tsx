'use client';
import { useTranslations } from 'next-intl';
import { Form, Formik } from 'formik';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';
import { useEffect, useState } from 'react';

import { IOrderLevelForm } from '@/lib/utils/interfaces/forms/loyalty.form.interface';
import { IDropdownSelectItem } from '@/lib/utils/interfaces';
import { OrderLevelSchema } from '@/lib/utils/schema/level';
import { COMPLETION_WINDOW_OPTIONS, LOYALTY_LEVELS } from '@/lib/utils/constants';
import { useLoyaltyContext } from '@/lib/hooks/useLoyalty';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import useToast from '@/lib/hooks/useToast';
import CustomDropdownComponent from '@/lib/ui/useable-components/custom-dropdown';
import CustomNumberField from '@/lib/ui/useable-components/number-input-field';
import {
  FetchOrderLoyaltyLevelsByUserTypeDocument,
  useCreateOrderLoyaltyLevelMutation,
  useEditOrderLoyaltyLevelMutation,
  useFetchOrderLoyaltyLevelByIdLazyQuery,
} from '@/lib/graphql-generated';

const initialData: IOrderLevelForm = { type: null, value: 0, completionWindow: null, requiredCompletedOrders: 1 };

export default function OrderLevelForm() {
  const t = useTranslations();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const { loyaltyType, loyaltyData, setLoyaltyData, orderLevelFormVisible, setOrderLevelFormVisible } =
    useLoyaltyContext();
  const { showToast } = useToast();

  const isCustomer = loyaltyType === 'Customer Loyalty Program';
  const userType = isCustomer ? 'customer' : 'driver';

  const [initialValues, setInitialValues] = useState<IOrderLevelForm>(initialData);

  const [fetchById, { loading }] = useFetchOrderLoyaltyLevelByIdLazyQuery();
  const [create, { loading: creating }] = useCreateOrderLoyaltyLevelMutation();
  const [update, { loading: updating }] = useEditOrderLoyaltyLevelMutation();

  const onHide = () => {
    setOrderLevelFormVisible(false);
    setLoyaltyData({ orderLevelId: '' });
  };

  useEffect(() => {
    const { orderLevelId } = loyaltyData || {};
    if (!orderLevelId) return;

    fetchById({ variables: { id: orderLevelId } }).then(({ data }) => {
      const level = data?.fetchOrderLoyaltyLevelById;
      if (level) {
        setInitialValues({
          type: LOYALTY_LEVELS.find((l) => l.code === level.name) as IDropdownSelectItem,
          value: (isCustomer ? level.points : level.amount) ?? 0,
          completionWindow: COMPLETION_WINDOW_OPTIONS.find((w) => w.code === level.completionWindow) as IDropdownSelectItem ?? null,
          requiredCompletedOrders: level.requiredCompletedOrders ?? 1,
        });
      }
    });
  }, [loyaltyData?.orderLevelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onHandleSubmit = async (values: IOrderLevelForm) => {
    try {
      if (!values.type?.code) {
        showToast({ type: 'warn', title: 'Missing Fields', message: 'Select a level' });
        return;
      }

      const { orderLevelId } = loyaltyData || {};
      const refetch = [{ query: FetchOrderLoyaltyLevelsByUserTypeDocument, variables: { userType } }];
      if (!values.completionWindow?.code) {
        showToast({ type: 'warn', title: 'Missing Fields', message: 'Select a completion window' });
        return;
      }

      const input = {
        name: values.type.code,
        userType,
        completionWindow: values.completionWindow.code,
        requiredCompletedOrders: values.requiredCompletedOrders,
        ...(isCustomer ? { points: values.value } : { amount: values.value }),
      };

      if (orderLevelId) {
        await update({
          variables: {
            id: orderLevelId,
            input: {
              name: values.type.code,
              completionWindow: values.completionWindow.code,
              requiredCompletedOrders: values.requiredCompletedOrders,
              ...(isCustomer ? { points: values.value } : { amount: values.value }),
            },
          },
          refetchQueries: refetch,
        });
      } else {
        await create({ variables: { input }, refetchQueries: refetch });
      }
      onHide();
    } catch (err) {
      showToast({ type: 'error', title: 'Failed.', message: (err as Error)?.message || 'Please try again later' });
    }
  };

  return (
    <Sidebar
      visible={orderLevelFormVisible}
      onHide={onHide}
      position="right"
      className="w-full sm:w-[450px] dark:bg-dark-950 dark:text-white"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={OrderLevelSchema}
        onSubmit={onHandleSubmit}
        validateOnChange
        enableReinitialize
      >
        {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <CustomDropdownComponent
                name="type"
                placeholder="Select Level"
                selectedItem={values.type}
                setSelectedItem={setFieldValue}
                options={LOYALTY_LEVELS}
                showLabel
                loading={loading}
              />
              <CustomNumberField
                min={0}
                max={999999}
                minFractionDigits={2}
                maxFractionDigits={2}
                placeholder={isCustomer ? 'Points per order' : `Amount per order (${CURRENCY_SYMBOL})`}
                name="value"
                showLabel
                value={values.value}
                onChange={setFieldValue}
                isLoading={loading}
              />
              <CustomDropdownComponent
                name="completionWindow"
                placeholder="Select Completion Window"
                selectedItem={values.completionWindow}
                setSelectedItem={setFieldValue}
                options={COMPLETION_WINDOW_OPTIONS}
                showLabel
                loading={loading}
              />
              <CustomNumberField
                min={1}
                max={9999}
                placeholder="Required completed orders"
                name="requiredCompletedOrders"
                showLabel
                value={values.requiredCompletedOrders}
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
                ) : loyaltyData?.orderLevelId ? t('Update') : t('Add')}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Sidebar>
  );
}
