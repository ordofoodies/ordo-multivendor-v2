"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Form,
  Formik,
  FormikProps,
  useFormikContext,
  validateYupSchema,
  yupToFormErrors,
} from "formik";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Button } from "primereact/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

import { CREATE_RIDER } from "@/lib/api/graphql/mutations";
import useToast from "@/lib/hooks/useToast";
import { sendEmail } from "@/lib/utils/methods";
import { RiderRegistrationFormValues } from "@/lib/utils/interfaces";

import {
  STEPS,
  StepId,
  initialRiderValues,
  isMotorized,
  toDocumentsInput,
} from "./constants";
import { stepValidationSchema } from "./validationSchema";
import StepHeader from "./StepHeader";
import AccountStep from "./steps/AccountStep";
import VehicleStep from "./steps/VehicleStep";
import PhotoStep from "./steps/PhotoStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import FormErrorFocus from "./FormErrorFocus";
import {
  UploadTrackerProvider,
  useUploadTracker,
  withoutLocalPreviews,
} from "./uploads";

interface RiderRegistrationFormProps {
  heading: string;
  role: string;
}

const DRAFT_KEY = "ordo-rider-application-draft";

interface Draft {
  values: Partial<RiderRegistrationFormValues>;
}

const readDraft = (): Draft | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // storage unavailable
  }
};

// saves progress so a refresh doesn't lose uploads; passwords are never stored
const DraftSaver = () => {
  const { values } = useFormikContext<RiderRegistrationFormValues>();
  useEffect(() => {
    const timer = setTimeout(() => {
      // in-flight previews (blob: URLs) die with the page, so don't keep them
      const safe: Partial<RiderRegistrationFormValues> = withoutLocalPreviews({ ...values });
      delete safe.password;
      delete safe.confirmPassword;
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: safe }));
      } catch {
        // storage unavailable
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [values]);
  return null;
};

const SubmittedState = () => {
  const t = useTranslations();
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-green-600" />
      <h3 className="text-xl font-semibold dark:text-gray-100">
        {t("rider_submitted_title")}
      </h3>
      <p className="max-w-sm text-sm text-gray-600 dark:text-gray-300">
        {t("rider_submitted_body")}
      </p>
      <Link href="/" className="text-sm font-medium text-primary-color">
        {t("rider_submitted_home")}
      </Link>
    </div>
  );
};

const RiderRegistrationWizard: React.FC<RiderRegistrationFormProps> = ({
  heading,
  role,
}) => {
  const t = useTranslations();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const formikRef = useRef<FormikProps<RiderRegistrationFormValues>>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [createRider] = useMutation(CREATE_RIDER);
  const tracker = useUploadTracker();
  const [finishingUploads, setFinishingUploads] = useState(false);

  const step: StepId = STEPS[stepIndex].id;
  const isLastStep = stepIndex === STEPS.length - 1;

  // restore a saved draft once on the client; ?ref= wins over the draft
  useEffect(() => {
    const draft = readDraft();
    const referralCode = searchParams.get("ref");
    if (draft?.values) {
      formikRef.current?.setValues(
        {
          ...initialRiderValues,
          ...draft.values,
          documents: { ...initialRiderValues.documents, ...draft.values.documents },
          password: "",
          confirmPassword: "",
          ...(referralCode ? { referralCode } : {}),
        },
        false
      );
      // passwords aren't saved, so a restored draft always starts on step 1
    } else if (referralCode) {
      formikRef.current?.setFieldValue("referralCode", referralCode, false);
    }
  }, [searchParams]);

  const goTo = (index: number) => {
    setStepIndex(index);
    formikRef.current?.setTouched({}, false);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validate = async (values: RiderRegistrationFormValues) => {
    try {
      await validateYupSchema(values, stepValidationSchema(t, step, values.vehicleType));
      return {};
    } catch (error) {
      return yupToFormErrors(error);
    }
  };

  const submitApplication = async (values: RiderRegistrationFormValues) => {
    const normalizedPhone = values.phoneNumber.startsWith("+")
      ? values.phoneNumber
      : `+${values.phoneNumber}`;
    const motorized = isMotorized(values.vehicleType);

    await createRider({
      variables: {
        riderInput: {
          _id: "",
          name: values.fullName.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          phone: normalizedPhone,
          password: values.password,
          ...(values.zoneId ? { zone: values.zoneId } : {}),
          workArea: values.deliveryArea.trim(),
          referralCode: values.referralCode.trim(),
          vehicleType: values.vehicleType,
          ...(motorized
            ? {
                vehicleDetails: {
                  number: values.vehicleNumber.trim(),
                  image: values.documents.vehicleRegistration.url,
                },
              }
            : {}),
          documents: toDocumentsInput(values),
          madeBy: "RIDER_REQUEST",
          riderRequestStatus: "PENDING",
          available: true,
        },
      },
    });

    // the application is saved at this point; the email only notifies the team
    const [firstName = "", ...rest] = values.fullName.trim().split(" ");
    sendEmail("template_kay0wlk", {
      fullName: values.fullName,
      firstName,
      lastName: rest.join(" "),
      username: values.username,
      email: values.email,
      phoneNumber: normalizedPhone,
      vehicleType: values.vehicleType,
      vehicleNumber: values.vehicleNumber,
      deliveryZone: values.zoneLabel,
      deliveryArea: values.deliveryArea,
      referralCode: values.referralCode,
      licenseImage: values.documents.driverLicense.url,
      vehicleDocumentImage: values.documents.vehicleRegistration.url,
      profilePhoto: values.profilePhoto,
      role,
      isRider: true,
    }).catch((error: unknown) =>
      console.error("Rider application email failed:", error)
    );
  };

  const handleSubmit = async (values: RiderRegistrationFormValues) => {
    if (!isLastStep) {
      goTo(stepIndex + 1);
      return;
    }

    // uploads keep running while the rider fills in the form; wait for them
    // and re-check, since one may have failed after its step was passed
    setFinishingUploads(true);
    await tracker?.waitForAll();
    setFinishingUploads(false);
    const latest = formikRef.current?.values ?? values;
    for (const check of ["photo", "documents"] as const) {
      try {
        await validateYupSchema(latest, stepValidationSchema(t, check, latest.vehicleType));
      } catch {
        showToast({
          type: "error",
          title: t("toast_error"),
          message: t("rider_upload_failed_retry"),
          duration: 5000,
        });
        goTo(STEPS.findIndex((s) => s.id === check));
        return;
      }
    }

    try {
      await submitApplication(latest);
      clearDraft();
      setSubmitted(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error: any) {
      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        t("failed_to_submit_form_please_try_again");
      console.error("Failed to submit rider registration:", error);
      showToast({ type: "error", title: t("toast_error"), message, duration: 5000 });
    }
  };

  return (
    <div
      ref={topRef}
      className="mx-auto my-6 max-w-xl scroll-mt-24 rounded-md bg-white p-6 shadow-lg dark:bg-gray-800"
    >
      <h2 className="mb-6 text-[20px] font-semibold dark:text-gray-100">{heading}</h2>

      {submitted ? (
        <SubmittedState />
      ) : (
        <>
          <StepHeader current={stepIndex} labels={STEPS.map((s) => t(s.labelKey))} />

          <Formik
            innerRef={formikRef}
            initialValues={initialRiderValues}
            validate={validate}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="grid gap-6" noValidate>
                <DraftSaver />

                {step === "account" && <AccountStep />}
                {step === "vehicle" && <VehicleStep />}
                {step === "photo" && <PhotoStep />}
                {step === "documents" && <DocumentsStep />}
                {step === "review" && (
                  <ReviewStep
                    onEdit={(target) => goTo(STEPS.findIndex((s) => s.id === target))}
                  />
                )}

                <FormErrorFocus key={step} />

                <div className="flex items-center justify-between gap-3">
                  {stepIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => goTo(stepIndex - 1)}
                      className="rounded-full px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {t("rider_back")}
                    </button>
                  ) : (
                    <span />
                  )}
                  <Button
                    type="submit"
                    label={
                      finishingUploads
                        ? t("rider_finishing_uploads")
                        : isLastStep
                          ? t("rider_submit_application")
                          : t("rider_next")
                    }
                    loading={isSubmitting}
                    className="min-w-[160px] rounded-full bg-primary-color p-2 text-[16px] font-medium text-white transition-all hover:bg-primary-color"
                  />
                </div>
              </Form>
            )}
          </Formik>
        </>
      )}
    </div>
  );
};

const RiderRegistrationForm: React.FC<RiderRegistrationFormProps> = (props) => (
  <UploadTrackerProvider>
    <RiderRegistrationWizard {...props} />
  </UploadTrackerProvider>
);

export default RiderRegistrationForm;
