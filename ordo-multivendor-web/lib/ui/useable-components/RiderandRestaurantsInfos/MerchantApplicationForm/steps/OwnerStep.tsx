"use client";

import { useTranslations } from "next-intl";

import PhoneNumberInput from "../../Form/phoneNumberInput/PhoneNumberInput";
import {
  FieldError,
  FieldLabel,
  PasswordField,
  TextField,
} from "../../RiderRegistrationForm/fields";

const OwnerStep = ({ editing }: { editing: boolean }) => {
  const t = useTranslations();

  return (
    <div className="grid gap-5">
      <p className="text-sm text-gray-600 dark:text-gray-300">{t("merchant_owner_intro")}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="firstName" label={t("first_name_label")} required />
        <TextField name="lastName" label={t("last_name_label")} required />
      </div>
      {editing ? null : (
        <TextField name="email" type="email" label={t("email_label")} required />
      )}
      <div>
        <FieldLabel label={t("phone_label")} required />
        <PhoneNumberInput />
        <FieldError name="phoneNumber" />
      </div>
      {editing ? null : (
        <>
          <PasswordField name="password" label={t("password_label")} required />
          <PasswordField name="confirmPassword" label={t("confirm_password_label")} required />
          <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("merchant_password_hint")}
          </p>
        </>
      )}
    </div>
  );
};

export default OwnerStep;
