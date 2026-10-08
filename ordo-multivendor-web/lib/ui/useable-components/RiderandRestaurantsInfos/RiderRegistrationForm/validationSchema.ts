import * as Yup from "yup";

import { StepId, documentsFor, isMotorized } from "./constants";
import { T, fieldRules } from "../fieldRules";

const accountSchema = (t: T) => {
  const rule = fieldRules(t);
  return {
    fullName: rule.personName(t("full_name_label")).required(t("full_name_required")),
    username: rule.username(t("username_label")).required(t("username_required")),
    phoneNumber: rule.phone().required(t("phoneNumberRequired")),
    email: rule.email().required(t("emailRequired")),
    password: rule.password().required(t("passwordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("confirmPasswordMismatch"))
      .required(t("confirmPasswordRequired")),
    referralCode: rule.referral(t("referral_code_label")),
  };
};

const vehicleSchema = (t: T) => {
  const rule = fieldRules(t);
  return {
    vehicleType: Yup.string().required(t("vehicle_type_required")),
    zoneId: Yup.string(),
    // a typed city is enough; the zone can be assigned by admin later
    deliveryArea: rule.place(t("rider_zone_label"), 120).when("zoneId", {
      is: (zoneId?: string) => !zoneId,
      then: (schema) => schema.required(t("rider_zone_required")),
      otherwise: (schema) => schema,
    }),
    vehicleNumber: rule.plate(t("vehicle_number_label")).when("vehicleType", {
      is: isMotorized,
      then: (schema) => schema.required(t("vehicle_number_required")),
      otherwise: (schema) => schema,
    }),
  };
};

const photoSchema = (t: T) => ({
  profilePhoto: Yup.string().required(t("rider_photo_required")),
});

const documentsSchema = (t: T, vehicleType: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shape: Record<string, Yup.AnyObjectSchema> = {};
  documentsFor(vehicleType).forEach((definition) => {
    // the bicycle ID document is optional
    const required = isMotorized(vehicleType);
    shape[definition.key] = Yup.object({
      url: required
        ? Yup.string().required(t("rider_doc_required"))
        : Yup.string(),
      backUrl: Yup.string(),
      number: definition.withNumber
        ? fieldRules(t).code(t(definition.withNumber)).required(t("rider_doc_number_required"))
        : Yup.string(),
      expiryDate: definition.withExpiry
        ? Yup.date()
            .typeError(t("rider_doc_expiry_required"))
            .required(t("rider_doc_expiry_required"))
            .min(today, t("rider_doc_expired"))
        : Yup.string(),
    });
  });
  return { documents: Yup.object(shape) };
};

const reviewSchema = (t: T) => ({
  termsAccepted: Yup.boolean().oneOf([true], t("rider_terms_required")),
});

export const stepValidationSchema = (t: T, step: StepId, vehicleType: string) => {
  switch (step) {
    case "account":
      return Yup.object(accountSchema(t));
    case "vehicle":
      return Yup.object(vehicleSchema(t));
    case "photo":
      return Yup.object(photoSchema(t));
    case "documents":
      return Yup.object(documentsSchema(t, vehicleType));
    case "review":
      return Yup.object(reviewSchema(t));
  }
};
