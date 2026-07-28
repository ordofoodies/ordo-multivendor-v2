"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Button } from "primereact/button";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import {
  faBicycle,
  faCar,
  faMotorcycle,
  faTruckPickup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { GET_ZONES } from "@/lib/api/graphql";
import { CREATE_RIDER } from "@/lib/api/graphql/mutations";
import useToast from "@/lib/hooks/useToast";
import { sendEmail } from "@/lib/utils/methods";
import {
  IMapZone,
  RiderRegistrationFormValues,
} from "@/lib/utils/interfaces";

import DocumentUploadField from "./DocumentUploadField";
import PhoneNumberInput from "../Form/phoneNumberInput/PhoneNumberInput";
import riderValidationSchema from "./validationSchema";

interface RiderRegistrationFormProps {
  heading: string;
  role: string;
}

interface ZoneOption {
  _id: string;
  label: string;
}

const initialValues: RiderRegistrationFormValues = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  vehicleType: "bicycle",
  zoneId: "",
  zoneLabel: "",
  referralCode: "",
  vehicleDocumentImage: "",
  licenseImage: "",
  vehicleNumber: "",
};

const vehicleOptions = [
  { key: "bicycle", icon: faBicycle, labelKey: "bicycle_label" },
  { key: "motorbike", icon: faMotorcycle, labelKey: "motorbike_label" },
  { key: "car", icon: faCar, labelKey: "car_label" },
  { key: "pickup truck", icon: faTruckPickup, labelKey: "pickup_truck_label" },
];

const RiderRegistrationForm: React.FC<RiderRegistrationFormProps> = ({
  heading,
  role,
}) => {
  const t = useTranslations();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const referralCodeFromUrl = searchParams.get("ref") ?? "";

  const formInitialValues = useMemo(
    () => ({
      ...initialValues,
      referralCode: referralCodeFromUrl,
    }),
    [referralCodeFromUrl]
  );

  const { data, loading: zonesLoading } = useQuery(GET_ZONES, {
    fetchPolicy: "cache-and-network",
  });

  const [createRider] = useMutation(CREATE_RIDER);

  const zoneOptions: ZoneOption[] =
    data?.zones?.map((zone: IMapZone) => ({
      _id: zone._id,
      label: zone.title,
    })) ?? [];

  const handleSubmit = async (
    formData: RiderRegistrationFormValues,
    {
      setSubmitting,
      resetForm,
    }: {
      setSubmitting: (isSubmitting: boolean) => void;
      resetForm: () => void;
    }
  ) => {
    const [firstName = "", ...restName] = formData.fullName.trim().split(" ");
    const lastName = restName.join(" ");
    const normalizedPhone = formData.phoneNumber.startsWith("+")
      ? formData.phoneNumber
      : `+${formData.phoneNumber}`;

    const templateParams = {
      ...formData,
      firstName,
      lastName,
      phoneNumber: normalizedPhone,
      role,
      isRider: true,
      deliveryZone: formData.zoneLabel,
    };

      const riderInput = {
      _id: "",
      name: formData.fullName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: normalizedPhone,
      password: formData.password,
      zone: formData.zoneId,
      referralCode: formData.referralCode.trim(),
      vehicleType: formData.vehicleType,
      licenseDetails: {
        image: formData.licenseImage,
      },
      vehicleDetails: {
        number: formData.vehicleNumber.trim(),
        image: formData.vehicleDocumentImage,
      },
      madeBy: "RIDER_REQUEST",
      riderRequestStatus: "PENDING",
      available: true,
    };

    try {
      await createRider({ variables: { riderInput } });
      await sendEmail("template_eogfh2k", templateParams);

      showToast({
        type: "success",
        title: t("toast_success"),
        message: t("form_submitted_successfully"),
        duration: 4000,
      });
      resetForm();
      
    } catch (error: any) {
      const backendMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        t("failed_to_submit_form_please_try_again");

      console.error("Failed to submit rider registration:", error);

      showToast({
        type: "error",
        title: t("toast_error"),
        message: backendMessage,
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-m my-6">
      <div className="mb-6">
        <h2 className="text-[20px] font-semibold dark:text-gray-100">
          {heading}
        </h2>
      </div>

      <Formik
        initialValues={formInitialValues}
        enableReinitialize
        validationSchema={riderValidationSchema(t)}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="grid gap-5">
            <div>
              <label className="text-sm dark:text-gray-300">
                {t("full_name_label")}
              </label>
              <Field name="fullName">
                {({ field }: any) => (
                  <InputText
                    placeholder={t("full_name_label")}
                    {...field}
                    className="w-full border-2 text-sm border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 p-2 rounded-lg"
                  />
                )}
              </Field>
              <ErrorMessage
                name="fullName"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("username_label")}
              </label>
              <Field name="username">
                {({ field }: any) => (
                  <InputText
                    placeholder={t("username_label")}
                    {...field}
                    className="w-full border-2 text-sm border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 p-2 rounded-lg"
                  />
                )}
              </Field>
              <ErrorMessage
                name="username"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("email_label")}
              </label>
              <Field name="email">
                {({ field }: any) => (
                  <InputText
                    placeholder={t("email_address_placeholder")}
                    {...field}
                    className="w-full border-2 text-sm border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 p-2 rounded-lg"
                  />
                )}
              </Field>
              <ErrorMessage
                name="email"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("phone_label")}
              </label>
              <PhoneNumberInput />
              <ErrorMessage
                name="phoneNumber"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("password_label")}
              </label>
              <Field name="password">
                {({ field }: any) => (
                  <Password
                    {...field}
                    inputClassName="bg-white text-black dark:bg-gray-700 dark:text-white"
                    panelClassName="bg-white text-black dark:bg-gray-700 dark:text-white"
                    placeholder={t("password")}
                    toggleMask
                    className="w-full text-sm border-2 border-gray-200 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    feedback={false}
                  />
                )}
              </Field>
              <ErrorMessage
                name="password"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("confirm_password_label")}
              </label>
              <Field name="confirmPassword">
                {({ field }: any) => (
                  <Password
                    {...field}
                    inputClassName="bg-white text-black dark:bg-gray-700 dark:text-white"
                    panelClassName="bg-white text-black dark:bg-gray-700 dark:text-white"
                    placeholder={t("confirm_password_label")}
                    toggleMask
                    className="w-full text-sm border-2 border-gray-200 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    feedback={false}
                  />
                )}
              </Field>
              <ErrorMessage
                name="confirmPassword"
                component="small"
                className="p-error text-sm"
              />
            </div>

           

        

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("vehicle_type_label")}
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {vehicleOptions.map((option) => {
                  const isSelected = values.vehicleType === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setFieldValue("vehicleType", option.key)}
                      className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                        isSelected
                          ? "border-primary-color bg-orange-50 text-primary-color dark:bg-gray-700"
                          : "border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <FontAwesomeIcon icon={option.icon} className="text-lg" />
                      <span>{t(option.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
              <ErrorMessage
                name="vehicleType"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("vehicle_number_label")}
              </label>
              <Field name="vehicleNumber">
                {({ field }: any) => (
                  <InputText
                    placeholder={t("vehicle_number_label")}
                    {...field}
                    className="w-full border-2 text-sm border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 p-2 rounded-lg"
                  />
                )}
              </Field>
              <ErrorMessage
                name="vehicleNumber"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300">
                {t("delivery_zone_label")}
              </label>
              <Dropdown
                value={values.zoneId}
                options={zoneOptions}
                optionLabel="label"
                optionValue="_id"
                placeholder={t("select_delivery_zone_placeholder")}
                onChange={(e: DropdownChangeEvent) => {
                  const selectedZone = zoneOptions.find(
                    (zone) => zone._id === e.value
                  );
                  setFieldValue("zoneId", e.value);
                  setFieldValue("zoneLabel", selectedZone?.label ?? "");
                }}
                loading={zonesLoading}
                className="md:w-20rem mt-2 h-11 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded text-sm"
                panelClassName="border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
              <style jsx global>{`
                html.dark .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
                  color: #f3f4f6;
                }

                html.dark
                  .p-dropdown-panel
                  .p-dropdown-items
                  .p-dropdown-item:hover,
                html.dark
                  .p-dropdown-panel
                  .p-dropdown-items
                  .p-dropdown-item.p-highlight,
                html.dark
                  .p-dropdown-panel
                  .p-dropdown-items
                  .p-dropdown-item.p-focus {
                  background: #374151;
                  color: #f9fafb;
                }
              `}</style>
              <ErrorMessage
                name="zoneId"
                component="small"
                className="p-error text-sm"
              />
            </div>

            <div>
              <DocumentUploadField
                label={t("vehicle_document_image_label")}
                value={values.vehicleDocumentImage}
                helperText={t("vehicle_document_helper_text")}
                onChange={(url) => setFieldValue("vehicleDocumentImage", url)}
              />
              <ErrorMessage
                name="vehicleDocumentImage"
                component="small"
                className="p-error text-sm"
              />
            </div>
 <div>
              <DocumentUploadField
                label={t("drivers_license_image_label")}
                value={values.licenseImage}
                onChange={(url) => setFieldValue("licenseImage", url)}
              />
              <ErrorMessage
                name="licenseImage"
                component="small"
                className="p-error text-sm"
              />
            </div>
            <div>
              <label className="text-sm dark:text-gray-300">
                {t("referral_code_label")} 
              </label>
              <Field name="referralCode">
                {({ field }: any) => (
                  <InputText
                    placeholder={t("referral_code_label")}
                    {...field}
                    className="w-full border-2 text-sm border-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 p-2 rounded-lg"
                  />
                )}
              </Field>
            </div>

            <div className="flex justify-center items-center">
              <Button
                type="submit"
                label={t("register_label")}
                loading={isSubmitting}
                className="mt-4 bg-primary-color text-[16px] font-medium w-[220px] p-2 rounded-full text-white hover:bg-primary-color transition-all"
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default RiderRegistrationForm;
