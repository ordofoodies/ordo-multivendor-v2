"use client";

import { useTranslations } from "next-intl";

import PhoneNumberInput from "../../Form/phoneNumberInput/PhoneNumberInput";
import { FieldError, FieldLabel, PasswordField, TextField } from "../fields";

const AccountStep = () => {
  const t = useTranslations();

  return (
    <div className="grid gap-5">
      <TextField name="fullName" label={t("full_name_label")} required />
      <TextField name="username" label={t("username_label")} required />
      <TextField
        name="email"
        type="email"
        label={t("email_label")}
        placeholder={t("email_address_placeholder")}
        required
      />
      <div>
        <FieldLabel label={t("phone_label")} required />
        <PhoneNumberInput />
        <FieldError name="phoneNumber" />
      </div>
      <PasswordField name="password" label={t("password_label")} required />
      <PasswordField
        name="confirmPassword"
        label={t("confirm_password_label")}
        required
      />
      <TextField name="referralCode" label={t("referral_code_label")} />
    </div>
  );
};

export default AccountStep;
