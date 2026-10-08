"use client";

import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, FieldProps, useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { Checkbox } from "primereact/checkbox";
import Link from "next/link";

import { RiderRegistrationFormValues } from "@/lib/utils/interfaces";

import { StepId, documentsFor, isMotorized, vehicleOptions } from "../constants";
import { FieldError } from "../fields";

interface ReviewStepProps {
  onEdit: (step: StepId) => void;
}

const Row = ({ label, value }: { label: string; value: string }) => (
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

const ReviewStep = ({ onEdit }: ReviewStepProps) => {
  const t = useTranslations();
  const { values } = useFormikContext<RiderRegistrationFormValues>();
  const vehicle = vehicleOptions.find((option) => option.key === values.vehicleType);

  return (
    <div className="grid gap-4">
      <Section title={t("rider_step_account")} editLabel={t("rider_review_edit")} onEdit={() => onEdit("account")}>
        <Row label={t("full_name_label")} value={values.fullName} />
        <Row label={t("username_label")} value={values.username} />
        <Row label={t("email_label")} value={values.email} />
        <Row label={t("phone_label")} value={values.phoneNumber} />
      </Section>

      <Section title={t("rider_step_vehicle")} editLabel={t("rider_review_edit")} onEdit={() => onEdit("vehicle")}>
        <Row label={t("vehicle_type_label")} value={vehicle ? t(vehicle.labelKey) : ""} />
        {isMotorized(values.vehicleType) ? (
          <Row label={t("vehicle_number_label")} value={values.vehicleNumber} />
        ) : null}
        <Row
          label={t("rider_zone_area")}
          value={values.deliveryArea || t("rider_zone_current_location")}
        />
      </Section>

      <Section title={t("rider_step_documents")} editLabel={t("rider_review_edit")} onEdit={() => onEdit("documents")}>
        <ul className="grid gap-1 text-sm">
          <li className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={values.profilePhoto ? faCircleCheck : faCircleExclamation}
              className={values.profilePhoto ? "text-green-600" : "text-amber-500"}
            />
            {t("rider_photo_label")}
          </li>
          {documentsFor(values.vehicleType).map((definition) => {
            const uploaded = !!values.documents[definition.key].url;
            return (
              <li key={definition.key} className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={uploaded ? faCircleCheck : faCircleExclamation}
                  className={uploaded ? "text-green-600" : "text-gray-400"}
                />
                {t(definition.labelKey)}
              </li>
            );
          })}
        </ul>
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
                {t("rider_terms_prefix")}{" "}
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
