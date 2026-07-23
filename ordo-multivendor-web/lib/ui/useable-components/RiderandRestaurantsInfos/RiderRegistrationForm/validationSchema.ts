import * as Yup from "yup";

const riderValidationSchema = (t: (key: string) => string) =>
  Yup.object({
    fullName: Yup.string().trim().required(t("full_name_required")),
    username: Yup.string()
      .trim()
      .matches(/^[a-zA-Z0-9_]+$/, t("please_enter_a_valid_name_message"))
      .required(t("username_required")),
    phoneNumber: Yup.string()
      .matches(/^\+?[0-9]{7,15}$/, t("phoneNumberInvalid"))
      .required(t("phoneNumberRequired")),
    email: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
    password: Yup.string()
      .min(6, t("passwordMin"))
      .required(t("passwordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("confirmPasswordMismatch"))
      .required(t("confirmPasswordRequired")),
    licenseImage: Yup.string().required(t("license_image_required")),
    vehicleType: Yup.string().required(t("vehicle_type_required")),
    vehicleNumber: Yup.string().required(t("vehicle_number_required")),
    zoneId: Yup.string().required(t("delivery_zone_required")),
    referralCode: Yup.string(),
    vehicleDocumentImage: Yup.string().required(
      t("vehicle_document_image_required")
    ),
    zoneLabel: Yup.string(),
  });

export default riderValidationSchema;
