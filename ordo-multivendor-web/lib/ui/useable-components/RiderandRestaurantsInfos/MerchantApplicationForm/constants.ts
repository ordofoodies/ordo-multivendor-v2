export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Day = (typeof DAYS)[number];

export interface DayHours {
  day: Day;
  open: boolean;
  start: string; // "HH:MM"
  end: string;
}

export interface MerchantFormValues {
  // owner
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string; // name required by the shared PhoneNumberInput
  password: string;
  confirmPassword: string;
  // store
  storeName: string;
  shopType: string;
  shopTypeName: string;
  cuisines: string[];
  storePhone: string;
  logo: string;
  coverImage: string;
  // location
  address: string;
  city: string;
  postCode: string;
  latitude: number | null;
  longitude: number | null;
  // true/false once checked against ÖRDO's zones, null when it couldn't be
  inServiceArea: boolean | null;
  // business
  legalName: string;
  registrationNumber: string;
  taxId: string;
  businessLicense: string;
  ownerId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingCode: string;
  // hours & menu
  hours: DayHours[];
  menuPhotos: string[];
  notes: string;
  termsAccepted: boolean;
}

export const MAX_MENU_PHOTOS = 10;

export const defaultHours = (): DayHours[] =>
  DAYS.map((day) => ({ day, open: true, start: "09:00", end: "22:00" }));

export const initialMerchantValues: MerchantFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  storeName: "",
  shopType: "",
  shopTypeName: "",
  cuisines: [],
  storePhone: "",
  logo: "",
  coverImage: "",
  address: "",
  city: "",
  postCode: "",
  latitude: null,
  longitude: null,
  inServiceArea: null,
  legalName: "",
  registrationNumber: "",
  taxId: "",
  businessLicense: "",
  ownerId: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  routingCode: "",
  hours: defaultHours(),
  menuPhotos: [],
  notes: "",
  termsAccepted: false,
};

export const MERCHANT_STEPS = [
  { id: "owner", labelKey: "merchant_step_owner" },
  { id: "store", labelKey: "merchant_step_store" },
  { id: "location", labelKey: "merchant_step_location" },
  { id: "business", labelKey: "merchant_step_business" },
  { id: "hours", labelKey: "merchant_step_hours" },
  { id: "review", labelKey: "merchant_step_review" },
] as const;

export type MerchantStepId = (typeof MERCHANT_STEPS)[number]["id"];

const split = (time: string) => time.split(":").slice(0, 2);

// MerchantApplicationInput for the API
export const toApplicationInput = (values: MerchantFormValues, withPassword: boolean) => {
  const phone = values.phoneNumber.startsWith("+")
    ? values.phoneNumber
    : `+${values.phoneNumber}`;
  const optional = (value: string) => value.trim() || undefined;

  return {
    owner: {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone,
      ...(withPassword ? { password: values.password } : {}),
    },
    business: {
      legalName: values.legalName.trim(),
      registrationNumber: optional(values.registrationNumber),
      taxId: optional(values.taxId),
      businessLicenseUrl: optional(values.businessLicense),
      ownerIdUrl: optional(values.ownerId),
    },
    store: {
      name: values.storeName.trim(),
      shopType: optional(values.shopType),
      cuisines: values.cuisines,
      phone: optional(values.storePhone),
      address: values.address.trim(),
      city: optional(values.city),
      postCode: optional(values.postCode),
      location: { latitude: values.latitude, longitude: values.longitude },
      logo: optional(values.logo),
      coverImage: optional(values.coverImage),
      openingTimes: values.hours.map((hours) => ({
        day: hours.day,
        times: hours.open ? [{ startTime: split(hours.start), endTime: split(hours.end) }] : [],
      })),
      menuPhotos: values.menuPhotos.filter(Boolean),
      notes: optional(values.notes),
    },
    bank: {
      bankName: values.bankName.trim(),
      accountHolder: values.accountHolder.trim(),
      accountNumber: values.accountNumber.trim(),
      routingCode: optional(values.routingCode),
    },
    termsAccepted: values.termsAccepted,
  };
};

interface ApplicationTimes {
  day: string;
  times?: { startTime?: string[]; endTime?: string[] }[] | null;
}

// prefills the wizard when an applicant updates an application
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fromApplication = (application: any): MerchantFormValues => {
  const times: ApplicationTimes[] = application.store.openingTimes ?? [];
  const hours = defaultHours().map((entry) => {
    const saved = times.find((t) => t.day === entry.day);
    if (!saved) return entry;
    const first = saved.times?.[0];
    return first?.startTime && first?.endTime
      ? { ...entry, open: true, start: first.startTime.join(":"), end: first.endTime.join(":") }
      : { ...entry, open: false };
  });

  return {
    ...initialMerchantValues,
    firstName: application.owner.firstName,
    lastName: application.owner.lastName,
    email: application.owner.email,
    phoneNumber: application.owner.phone,
    storeName: application.store.name,
    shopType: application.store.shopType?._id ?? "",
    shopTypeName: application.store.shopType?.name ?? "",
    cuisines: application.store.cuisines ?? [],
    storePhone: application.store.phone ?? "",
    logo: application.store.logo ?? "",
    coverImage: application.store.coverImage ?? "",
    address: application.store.address,
    city: application.store.city ?? "",
    postCode: application.store.postCode ?? "",
    latitude: application.store.location?.latitude ?? null,
    longitude: application.store.location?.longitude ?? null,
    inServiceArea: true,
    legalName: application.business.legalName,
    registrationNumber: application.business.registrationNumber ?? "",
    taxId: application.business.taxId ?? "",
    businessLicense: application.business.businessLicenseUrl ?? "",
    ownerId: application.business.ownerIdUrl ?? "",
    bankName: application.bank?.bankName ?? "",
    accountHolder: application.bank?.accountHolder ?? "",
    accountNumber: application.bank?.accountNumber ?? "",
    routingCode: application.bank?.routingCode ?? "",
    hours,
    menuPhotos: application.store.menuPhotos ?? [],
    notes: application.store.notes ?? "",
    termsAccepted: true,
  };
};
