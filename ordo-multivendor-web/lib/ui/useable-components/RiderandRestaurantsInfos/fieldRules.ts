import * as Yup from "yup";

// Allowed characters and lengths for the rider and merchant sign-up forms.
// The API checks the same rules (ordo-api-v2/helpers/fieldRules.js); keep the
// two in step.

export type T = (key: string, values?: Record<string, string | number>) => string;

export const RX = {
  // letters in any language, spaces, apostrophes, hyphens, dots: "María José O'Neil-Peña"
  personName: /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u,
  // letters, numbers and common business punctuation: "Café #1 & Co. (SRL)"
  businessName: /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} &'’.,()/#!+-]*$/u,
  username: /^[A-Za-z0-9_]+$/,
  phone: /^\+?[0-9]{7,15}$/,
  // anything printable except characters used for markup/injection
  freeText: /^[^<>{}\\]*$/,
  // cities / work areas, incl. names filled in from GPS: "Santo Domingo, D.N."
  place: /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} ,.'’()&#/-]*$/u,
  postCode: /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
  // registration / tax id / document numbers: "131-12345-6", "A1234567"
  code: /^[A-Za-z0-9][A-Za-z0-9 /.-]*$/,
  plate: /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
  accountNumber: /^[A-Za-z0-9]+$/,
  referral: /^[A-Za-z0-9_-]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
};

// spaces, dashes and brackets people type into phone and account numbers
export const stripSeparators = (value?: string) => value?.replace(/[\s().-]/g, "") ?? value;

export const fieldRules = (t: T) => {
  const text = (field: string, rx: RegExp, charsKey: string, min: number, max: number) =>
    Yup.string()
      .trim()
      .matches(rx, { message: t(charsKey, { field }), excludeEmptyString: true })
      .test("min", t("validation_too_short", { field, min }), (v) => !v || v.length >= min)
      .max(max, t("validation_too_long", { field, max }));

  return {
    personName: (field: string, min = 2, max = 60) => text(field, RX.personName, "validation_name_chars", min, max),
    businessName: (field: string, max = 80) => text(field, RX.businessName, "validation_business_chars", 2, max),
    place: (field: string, max = 80) => text(field, RX.place, "validation_place_chars", 2, max),
    address: (field: string) => text(field, RX.freeText, "validation_text_chars", 5, 200),
    freeText: (field: string, max = 500) => text(field, RX.freeText, "validation_text_chars", 0, max),
    postCode: (field: string) => text(field, RX.postCode, "validation_code_chars", 3, 10),
    code: (field: string, min = 3, max = 30) => text(field, RX.code, "validation_code_chars", min, max),
    plate: (field: string) => text(field, RX.plate, "validation_code_chars", 2, 12),
    username: (field: string) => text(field, RX.username, "validation_username_chars", 3, 30),
    referral: (field: string) => text(field, RX.referral, "validation_code_chars", 3, 30),
    accountNumber: (field: string) =>
      Yup.string()
        .transform(stripSeparators)
        .matches(RX.accountNumber, { message: t("validation_account_chars", { field }), excludeEmptyString: true })
        .test("len", t("validation_account_length", { field }), (v) => !v || (v.length >= 5 && v.length <= 34)),
    phone: () =>
      Yup.string()
        .transform(stripSeparators)
        .matches(RX.phone, { message: t("phoneNumberInvalid"), excludeEmptyString: true }),
    email: () =>
      Yup.string()
        .trim()
        .email(t("emailInvalid"))
        // yup accepts "a@b"; require a real domain ending like .com
        .matches(RX.email, { message: t("emailInvalid"), excludeEmptyString: true })
        .max(254, t("validation_too_long", { field: t("email_label"), max: 254 })),
    password: () =>
      Yup.string()
        .min(6, t("passwordMin"))
        .max(64, t("validation_too_long", { field: t("password_label"), max: 64 })),
  };
};
