"use client";

import { useEffect, useRef, useState } from "react";
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

import {
  RESUBMIT_MERCHANT_APPLICATION,
  SUBMIT_MERCHANT_APPLICATION,
} from "@/lib/api/graphql/mutations";
import useToast from "@/lib/hooks/useToast";

import StepHeader from "../RiderRegistrationForm/StepHeader";
import {
  UploadTrackerProvider,
  useUploadTracker,
  withoutLocalPreviews,
} from "../RiderRegistrationForm/uploads";
import {
  MERCHANT_STEPS,
  MerchantFormValues,
  MerchantStepId,
  initialMerchantValues,
  toApplicationInput,
} from "./constants";
import { merchantStepSchema } from "./validationSchema";
import OwnerStep from "./steps/OwnerStep";
import StoreStep from "./steps/StoreStep";
import LocationStep from "./steps/LocationStep";
import BusinessStep from "./steps/BusinessStep";
import HoursStep from "./steps/HoursStep";
import ReviewStep from "./steps/ReviewStep";
import FormErrorFocus from "../RiderRegistrationForm/FormErrorFocus";

const DRAFT_KEY = "ordo-merchant-application-draft";

interface MerchantApplicationFormProps {
  heading: string;
  // set when the applicant is updating an application admin sent back
  update?: {
    email: string;
    password: string;
    values: MerchantFormValues;
    onUpdated: () => void;
  };
}

const readDraft = (): Partial<MerchantFormValues> | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
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

// saves progress locally; passwords and the bank account number are never stored
const DraftSaver = () => {
  const { values } = useFormikContext<MerchantFormValues>();
  useEffect(() => {
    const timer = setTimeout(() => {
      const safe: Partial<MerchantFormValues> = withoutLocalPreviews({ ...values });
      delete safe.password;
      delete safe.confirmPassword;
      delete safe.accountNumber;
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
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
      <h3 className="text-xl font-semibold dark:text-gray-100">{t("merchant_submitted_title")}</h3>
      <p className="max-w-sm text-sm text-gray-600 dark:text-gray-300">{t("merchant_submitted_body")}</p>
      <Link href="/restaurantInfo/status" className="text-sm font-medium text-primary-color">
        {t("merchant_check_status")}
      </Link>
    </div>
  );
};

const MerchantWizard = ({ heading, update }: MerchantApplicationFormProps) => {
  const t = useTranslations();
  const { showToast } = useToast();
  const tracker = useUploadTracker();
  const formikRef = useRef<FormikProps<MerchantFormValues>>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [finishingUploads, setFinishingUploads] = useState(false);
  const [submit] = useMutation(SUBMIT_MERCHANT_APPLICATION);
  const [resubmit] = useMutation(RESUBMIT_MERCHANT_APPLICATION);

  const withPassword = !update;
  const step: MerchantStepId = MERCHANT_STEPS[stepIndex].id;
  const isLastStep = stepIndex === MERCHANT_STEPS.length - 1;

  useEffect(() => {
    if (update) return;
    const draft = readDraft();
    if (draft) {
      formikRef.current?.setValues({ ...initialMerchantValues, ...draft }, false);
    }
  }, [update]);

  const goTo = (index: number) => {
    setStepIndex(index);
    formikRef.current?.setTouched({}, false);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validate = async (values: MerchantFormValues) => {
    try {
      await validateYupSchema(values, merchantStepSchema(t, step, withPassword));
      return {};
    } catch (error) {
      return yupToFormErrors(error);
    }
  };

  const handleSubmit = async (values: MerchantFormValues) => {
    if (!isLastStep) {
      goTo(stepIndex + 1);
      return;
    }

    setFinishingUploads(true);
    await tracker?.waitForAll();
    setFinishingUploads(false);
    const latest = formikRef.current?.values ?? values;

    // an upload may have failed after its step was passed
    for (const [index, { id }] of MERCHANT_STEPS.entries()) {
      try {
        await validateYupSchema(latest, merchantStepSchema(t, id, withPassword));
      } catch {
        showToast({ type: "error", title: t("toast_error"), message: t("merchant_fix_step"), duration: 5000 });
        goTo(index);
        return;
      }
    }

    try {
      if (update) {
        await resubmit({
          variables: {
            email: update.email,
            password: update.password,
            input: toApplicationInput(latest, false),
          },
        });
        update.onUpdated();
      } else {
        await submit({ variables: { input: toApplicationInput(latest, true) } });
        clearDraft();
        setSubmitted(true);
      }
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error: any) {
      const message =
        error?.graphQLErrors?.[0]?.message || error?.message || t("failed_to_submit_form_please_try_again");
      showToast({ type: "error", title: t("toast_error"), message, duration: 6000 });
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
          <StepHeader current={stepIndex} labels={MERCHANT_STEPS.map((s) => t(s.labelKey))} />
          <Formik
            innerRef={formikRef}
            initialValues={update?.values ?? initialMerchantValues}
            validate={validate}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="grid gap-6" noValidate>
                {update ? null : <DraftSaver />}

                {step === "owner" && <OwnerStep editing={!!update} />}
                {step === "store" && <StoreStep />}
                {step === "location" && <LocationStep />}
                {step === "business" && <BusinessStep />}
                {step === "hours" && <HoursStep />}
                {step === "review" && (
                  <ReviewStep onEdit={(target) => goTo(MERCHANT_STEPS.findIndex((s) => s.id === target))} />
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
                          ? update
                            ? t("merchant_resubmit")
                            : t("merchant_submit")
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

const MerchantApplicationForm = (props: MerchantApplicationFormProps) => (
  <UploadTrackerProvider>
    <MerchantWizard {...props} />
  </UploadTrackerProvider>
);

export default MerchantApplicationForm;
