"use client";

import { Field, FieldProps, useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { Checkbox } from "primereact/checkbox";
import Link from "next/link";

import { FieldError } from "../../RiderRegistrationForm/fields";
import { MerchantFormValues, MerchantStepId } from "../constants";

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between gap-4 py-1 text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-end font-medium text-gray-900 dark:text-gray-100">{value || "-"}</span>
  </div>
);

const Section = ({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-600">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="font-semibold dark:text-gray-100">{title}</h3>
      <button type="button" onClick={onEdit} className="text-xs font-medium text-primary-color">
        {editLabel}
      </button>
    </div>
    {children}
  </section>
);

// last 4 characters only, so the account number isn't shown in full on screen
const masked = (value: string) => (value.length > 4 ? `•••• ${value.slice(-4)}` : value);

const ReviewStep = ({ onEdit }: { onEdit: (step: MerchantStepId) => void }) => {
  const t = useTranslations();
  const { values } = useFormikContext<MerchantFormValues>();
  const edit = t("rider_review_edit");
  const openDays = values.hours
    .filter((day) => day.open)
    .map((day) => t(`merchant_day_${day.day.toLowerCase()}`))
    .join(", ");

  return (
    <div className="grid gap-4">
      <Section title={t("merchant_step_owner")} editLabel={edit} onEdit={() => onEdit("owner")}>
        <Row label={t("full_name_label")} value={`${values.firstName} ${values.lastName}`} />
        <Row label={t("email_label")} value={values.email} />
        <Row label={t("phone_label")} value={values.phoneNumber} />
      </Section>

      <Section title={t("merchant_step_store")} editLabel={edit} onEdit={() => onEdit("store")}>
        <Row label={t("merchant_store_name")} value={values.storeName} />
        <Row label={t("merchant_shop_type")} value={values.shopTypeName} />
        <Row label={t("merchant_cuisines")} value={values.cuisines.join(", ")} />
      </Section>

      <Section title={t("merchant_step_location")} editLabel={edit} onEdit={() => onEdit("location")}>
        <Row label={t("merchant_address")} value={values.address} />
      </Section>

      <Section title={t("merchant_step_business")} editLabel={edit} onEdit={() => onEdit("business")}>
        <Row label={t("merchant_legal_name")} value={values.legalName} />
        <Row label={t("merchant_bank_name")} value={values.bankName} />
        <Row label={t("merchant_account_number")} value={masked(values.accountNumber)} />
      </Section>

      <Section title={t("merchant_step_hours")} editLabel={edit} onEdit={() => onEdit("hours")}>
        <Row label={t("merchant_open_days")} value={openDays} />
        <Row
          label={t("merchant_menu_heading")}
          value={t("merchant_menu_count", { count: values.menuPhotos.filter(Boolean).length })}
        />
      </Section>

      <div>
        <Field name="termsAccepted">
          {({ field, form }: FieldProps) => (
            <label className="flex items-start gap-3 text-sm dark:text-gray-200">
              <Checkbox
                inputId="termsAccepted"
                checked={!!field.value}
                onChange={(e) => form.setFieldValue("termsAccepted", !!e.checked)}
              />
              <span>
                {t("merchant_terms_prefix")}{" "}
                <Link href="/terms" target="_blank" className="text-primary-color underline">
                  {t("rider_terms_link")}
                </Link>
              </span>
            </label>
          )}
        </Field>
        <FieldError name="termsAccepted" />
      </div>
    </div>
  );
};

export default ReviewStep;
