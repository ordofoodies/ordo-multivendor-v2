import {
  faBicycle,
  faCar,
  faMotorcycle,
  faTruckPickup,
} from "@fortawesome/free-solid-svg-icons";

import {
  RiderDocumentFormValue,
  RiderDocumentKey,
  RiderRegistrationFormValues,
} from "@/lib/utils/interfaces";

export const vehicleOptions = [
  { key: "bicycle", icon: faBicycle, labelKey: "bicycle_label" },
  { key: "motorbike", icon: faMotorcycle, labelKey: "motorbike_label" },
  { key: "car", icon: faCar, labelKey: "car_label" },
  { key: "pickup truck", icon: faTruckPickup, labelKey: "pickup_truck_label" },
];

// mirrors helpers/riderDocuments.js in the API
export const isMotorized = (vehicleType: string) =>
  !!vehicleType && vehicleType.toLowerCase() !== "bicycle";

export interface RiderDocumentDefinition {
  key: RiderDocumentKey;
  labelKey: string;
  helperKey: string;
  withBack?: boolean;
  withNumber?: string; // translation key of the number field label
  withExpiry?: boolean;
}

export const MOTORIZED_DOCUMENTS: RiderDocumentDefinition[] = [
  {
    key: "driverLicense",
    labelKey: "rider_doc_driver_license",
    helperKey: "rider_doc_driver_license_helper",
    withBack: true,
    withNumber: "rider_doc_license_number",
    withExpiry: true,
  },
  {
    key: "vehicleRegistration",
    labelKey: "rider_doc_vehicle_registration",
    helperKey: "rider_doc_vehicle_registration_helper",
  },
  {
    key: "insurance",
    labelKey: "rider_doc_insurance",
    helperKey: "rider_doc_insurance_helper",
    withNumber: "rider_doc_policy_number",
    withExpiry: true,
  },
  {
    key: "platePhoto",
    labelKey: "rider_doc_plate_photo",
    helperKey: "rider_doc_plate_photo_helper",
  },
  {
    key: "ownershipProof",
    labelKey: "rider_doc_ownership_proof",
    helperKey: "rider_doc_ownership_proof_helper",
  },
];

export const BICYCLE_DOCUMENTS: RiderDocumentDefinition[] = [
  {
    key: "idDocument",
    labelKey: "rider_doc_id_document",
    helperKey: "rider_doc_id_document_helper",
  },
];

export const documentsFor = (vehicleType: string) =>
  isMotorized(vehicleType) ? MOTORIZED_DOCUMENTS : BICYCLE_DOCUMENTS;

export const emptyDocument = (): RiderDocumentFormValue => ({
  url: "",
  backUrl: "",
  number: "",
  expiryDate: "",
});

export const initialRiderValues: RiderRegistrationFormValues = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
  vehicleType: "motorbike",
  vehicleNumber: "",
  zoneId: "",
  zoneLabel: "",
  deliveryArea: "",
  profilePhoto: "",
  documents: {
    driverLicense: emptyDocument(),
    vehicleRegistration: emptyDocument(),
    insurance: emptyDocument(),
    platePhoto: emptyDocument(),
    ownershipProof: emptyDocument(),
    idDocument: emptyDocument(),
  },
  termsAccepted: false,
};

export const STEPS = [
  { id: "account", labelKey: "rider_step_account" },
  { id: "vehicle", labelKey: "rider_step_vehicle" },
  { id: "photo", labelKey: "rider_step_photo" },
  { id: "documents", labelKey: "rider_step_documents" },
  { id: "review", labelKey: "rider_step_review" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

// builds RiderDocumentsInput from the form, sending only what the vehicle needs
export const toDocumentsInput = (values: RiderRegistrationFormValues) => {
  const input: Record<string, unknown> = {};
  if (values.profilePhoto) input.profilePhoto = values.profilePhoto;

  documentsFor(values.vehicleType).forEach((definition) => {
    const doc = values.documents[definition.key];
    if (!doc.url) return;
    input[definition.key] = {
      url: doc.url,
      ...(definition.withBack && doc.backUrl ? { backUrl: doc.backUrl } : {}),
      ...(definition.withNumber && doc.number
        ? { number: doc.number.trim() }
        : {}),
      ...(definition.withExpiry && doc.expiryDate
        ? { expiryDate: doc.expiryDate }
        : {}),
    };
  });
  return input;
};
