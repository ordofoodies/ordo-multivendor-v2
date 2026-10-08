"use client";

import { useQuery } from "@apollo/client";
import { getIn, useFormikContext } from "formik";
import { useTranslations } from "next-intl";

import { MERCHANT_FORM_OPTIONS } from "@/lib/api/graphql/mutations";

import DocumentUploadField from "../../RiderRegistrationForm/DocumentUploadField";
import { FieldError, FieldLabel, TextField } from "../../RiderRegistrationForm/fields";
import { MerchantFormValues } from "../constants";

interface Option {
  _id: string;
  name: string;
  shopType?: string;
}

const chipClass = (selected: boolean) =>
  `rounded-full border-2 px-4 py-2 text-sm transition-colors ${
    selected
      ? "border-primary-color bg-orange-50 text-primary-color dark:bg-gray-700"
      : "border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300"
  }`;

const StoreStep = () => {
  const t = useTranslations();
  const { values, errors, touched, setFieldValue } = useFormikContext<MerchantFormValues>();
  const { data, loading } = useQuery(MERCHANT_FORM_OPTIONS, { fetchPolicy: "cache-first" });

  const shopTypes: Option[] = data?.fetchAllShopTypes?.data ?? [];
  const cuisines: Option[] = (data?.cuisines ?? []).filter(
    (cuisine: Option) =>
      !values.shopTypeName ||
      cuisine.shopType?.toLowerCase() === values.shopTypeName.toLowerCase()
  );
  const errorFor = (path: string) => (getIn(touched, path) ? getIn(errors, path) : undefined);

  const toggleCuisine = (name: string) =>
    setFieldValue(
      "cuisines",
      values.cuisines.includes(name)
        ? values.cuisines.filter((c) => c !== name)
        : [...values.cuisines, name]
    );

  return (
    <div className="grid gap-5">
      <TextField name="storeName" label={t("merchant_store_name")} required />

      <div>
        <FieldLabel label={t("merchant_shop_type")} required />
        <div className="mt-2 flex flex-wrap gap-2">
          {loading && !shopTypes.length ? (
            <span className="text-sm text-gray-500">{t("merchant_loading")}</span>
          ) : null}
          {shopTypes.map((type) => (
            <button
              key={type._id}
              type="button"
              aria-pressed={values.shopType === type._id}
              onClick={() => {
                setFieldValue("shopType", type._id);
                setFieldValue("shopTypeName", type.name);
                // cuisines belong to a shop type
                if (values.shopType !== type._id) setFieldValue("cuisines", []);
              }}
              className={chipClass(values.shopType === type._id)}
            >
              {type.name}
            </button>
          ))}
        </div>
        <FieldError name="shopType" />
      </div>

      {values.shopType && cuisines.length ? (
        <div>
          <FieldLabel label={t("merchant_cuisines")} />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("merchant_cuisines_hint")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine._id}
                type="button"
                aria-pressed={values.cuisines.includes(cuisine.name)}
                onClick={() => toggleCuisine(cuisine.name)}
                className={chipClass(values.cuisines.includes(cuisine.name))}
              >
                {cuisine.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <TextField
        name="storePhone"
        type="tel"
        label={t("merchant_store_phone")}
        placeholder={t("merchant_store_phone_placeholder")}
      />

      <DocumentUploadField
        label={t("merchant_logo")}
        helperText={t("merchant_logo_hint")}
        value={values.logo}
        aspect="square"
        maxDimension={800}
        required
        error={errorFor("logo")}
        onChange={(url) => setFieldValue("logo", url)}
      />

      <DocumentUploadField
        label={t("merchant_cover")}
        helperText={t("merchant_cover_hint")}
        value={values.coverImage}
        onChange={(url) => setFieldValue("coverImage", url)}
      />
    </div>
  );
};

export default StoreStep;
