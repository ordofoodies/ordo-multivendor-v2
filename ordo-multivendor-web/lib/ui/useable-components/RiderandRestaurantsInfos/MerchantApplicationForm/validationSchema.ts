import * as Yup from "yup";

import { MerchantStepId } from "./constants";
import { T, fieldRules } from "../fieldRules";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const ownerSchema = (t: T, withPassword: boolean) => {
  const rule = fieldRules(t);
  return Yup.object({
    firstName: rule.personName(t("first_name_label"), 1, 40).required(t("merchant_required")),
    lastName: rule.personName(t("last_name_label"), 1, 40).required(t("merchant_required")),
    email: rule.email().required(t("emailRequired")),
    phoneNumber: rule.phone().required(t("phoneNumberRequired")),
    ...(withPassword
      ? {
          password: rule.password().required(t("passwordRequired")),
          confirmPassword: Yup.string()
            .oneOf([Yup.ref("password")], t("confirmPasswordMismatch"))
            .required(t("confirmPasswordRequired")),
        }
      : {}),
  });
};

const storeSchema = (t: T) => {
  const rule = fieldRules(t);
  return Yup.object({
    storeName: rule.businessName(t("merchant_store_name"), 60).required(t("merchant_required")),
    shopType: Yup.string().required(t("merchant_shop_type_required")),
    storePhone: rule.phone(),
    logo: Yup.string().required(t("merchant_logo_required")),
  });
};

const locationSchema = (t: T) => {
  const rule = fieldRules(t);
  return Yup.object({
    address: rule.address(t("merchant_address")).required(t("merchant_address_required")),
    city: rule.place(t("merchant_city"), 60),
    postCode: rule.postCode(t("merchant_post_code")),
    latitude: Yup.number().nullable().required(t("merchant_pin_required")),
    // null means we couldn't check; the server validates again on submit
    inServiceArea: Yup.mixed().test(
      "served",
      t("merchant_outside_service_area"),
      (value) => value !== false
    ),
  });
};

const businessSchema = (t: T) => {
  const rule = fieldRules(t);
  return Yup.object({
    legalName: rule.businessName(t("merchant_legal_name"), 100).required(t("merchant_required")),
    registrationNumber: rule.code(t("merchant_registration_number")),
    taxId: rule.code(t("merchant_tax_id")),
    ownerId: Yup.string().required(t("merchant_owner_id_required")),
    bankName: rule.businessName(t("merchant_bank_name"), 60).required(t("merchant_required")),
    accountHolder: rule.businessName(t("merchant_account_holder"), 80).required(t("merchant_required")),
    accountNumber: rule.accountNumber(t("merchant_account_number")).required(t("merchant_required")),
    routingCode: rule.code(t("merchant_routing_code"), 3, 15),
  });
};

const hoursSchema = (t: T) =>
  Yup.object({
    notes: fieldRules(t).freeText(t("merchant_notes")),
    hours: Yup.array()
      .of(
        Yup.object({
          open: Yup.boolean(),
          start: Yup.string().when("open", {
            is: true,
            then: (s) => s.matches(TIME, t("merchant_time_invalid")).required(t("merchant_time_invalid")),
          }),
          end: Yup.string().when("open", {
            is: true,
            then: (s) =>
              s
                .matches(TIME, t("merchant_time_invalid"))
                .required(t("merchant_time_invalid"))
                .test("after", t("merchant_time_order"), function (end) {
                  return !end || end > this.parent.start;
                }),
          }),
        })
      )
      .test("any-open", t("merchant_hours_required"), (hours) =>
        (hours ?? []).some((day) => day.open)
      ),
  });

const reviewSchema = (t: T) =>
  Yup.object({
    termsAccepted: Yup.boolean().oneOf([true], t("rider_terms_required")),
  });

export const merchantStepSchema = (t: T, step: MerchantStepId, withPassword: boolean) => {
  switch (step) {
    case "owner":
      return ownerSchema(t, withPassword);
    case "store":
      return storeSchema(t);
    case "location":
      return locationSchema(t);
    case "business":
      return businessSchema(t);
    case "hours":
      return hoursSchema(t);
    case "review":
      return reviewSchema(t);
  }
};
