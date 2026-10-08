"use client";

import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getIn, useFormikContext } from "formik";
import { useTranslations } from "next-intl";

import DocumentUploadField from "../../RiderRegistrationForm/DocumentUploadField";
import { TextField } from "../../RiderRegistrationForm/fields";
import { MerchantFormValues } from "../constants";

const BusinessStep = () => {
  const t = useTranslations();
  const { values, errors, touched, setFieldValue } = useFormikContext<MerchantFormValues>();
  const errorFor = (path: string) => (getIn(touched, path) ? getIn(errors, path) : undefined);

  return (
    <div className="grid gap-6">
      <section className="grid gap-5">
        <h3 className="font-semibold dark:text-gray-100">{t("merchant_business_heading")}</h3>
        <TextField
          name="legalName"
          label={t("merchant_legal_name")}
          placeholder={t("merchant_legal_name_placeholder")}
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="registrationNumber" label={t("merchant_registration_number")} />
          <TextField name="taxId" label={t("merchant_tax_id")} />
        </div>
        <DocumentUploadField
          label={t("merchant_owner_id")}
          helperText={t("merchant_owner_id_hint")}
          value={values.ownerId}
          required
          error={errorFor("ownerId")}
          onChange={(url) => setFieldValue("ownerId", url)}
        />
        <DocumentUploadField
          label={t("merchant_business_license")}
          helperText={t("merchant_business_license_hint")}
          value={values.businessLicense}
          onChange={(url) => setFieldValue("businessLicense", url)}
        />
      </section>

      <section className="grid gap-5">
        <div>
          <h3 className="font-semibold dark:text-gray-100">{t("merchant_payout_heading")}</h3>
          <p className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faLock} />
            {t("merchant_payout_hint")}
          </p>
        </div>
        <TextField name="bankName" label={t("merchant_bank_name")} required />
        <TextField name="accountHolder" label={t("merchant_account_holder")} required />
        <TextField name="accountNumber" label={t("merchant_account_number")} required />
        <TextField name="routingCode" label={t("merchant_routing_code")} />
      </section>
    </div>
  );
};

export default BusinessStep;
