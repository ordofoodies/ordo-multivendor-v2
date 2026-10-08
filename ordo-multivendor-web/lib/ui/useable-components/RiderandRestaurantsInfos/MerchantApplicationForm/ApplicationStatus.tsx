"use client";

import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { Form, Formik } from "formik";
import { useTranslations } from "next-intl";
import { Button } from "primereact/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import * as Yup from "yup";

import { MERCHANT_APPLICATION_STATUS } from "@/lib/api/graphql/mutations";
import useToast from "@/lib/hooks/useToast";

import { PasswordField, TextField } from "../RiderRegistrationForm/fields";
import MerchantApplicationForm from ".";
import { fromApplication } from "./constants";

interface Credentials {
  email: string;
  password: string;
}

const StatusCard = ({
  icon,
  tone,
  title,
  children,
}: {
  icon: typeof faCircleCheck;
  tone: string;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="mx-auto my-6 flex max-w-xl flex-col items-center gap-3 rounded-md bg-white p-6 text-center shadow-lg dark:bg-gray-800">
    <FontAwesomeIcon icon={icon} className={`text-4xl ${tone}`} />
    <h3 className="text-lg font-semibold dark:text-gray-100">{title}</h3>
    <div className="max-w-sm text-sm text-gray-600 dark:text-gray-300">{children}</div>
  </div>
);

const ApplicationStatus = () => {
  const t = useTranslations();
  const { showToast } = useToast();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [fetchStatus, { data, loading, refetch }] = useLazyQuery(MERCHANT_APPLICATION_STATUS, {
    fetchPolicy: "network-only",
  });
  const application = data?.merchantApplicationStatus;

  const signIn = async (values: Credentials) => {
    const result = await fetchStatus({ variables: values });
    if (result.error) {
      showToast({
        type: "error",
        title: t("toast_error"),
        message: result.error.graphQLErrors?.[0]?.message ?? t("failed_to_submit_form_please_try_again"),
        duration: 4000,
      });
      return;
    }
    setCredentials(values);
  };

  if (!credentials || !application) {
    return (
      <div className="mx-auto my-6 max-w-xl rounded-md bg-white p-6 shadow-lg dark:bg-gray-800">
        <Formik<Credentials>
          initialValues={{ email: "", password: "" }}
          validationSchema={Yup.object({
            email: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
            password: Yup.string().required(t("passwordRequired")),
          })}
          onSubmit={signIn}
        >
          <Form className="grid gap-5" noValidate>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t("merchant_status_intro")}</p>
            <TextField name="email" type="email" label={t("email_label")} required />
            <PasswordField name="password" label={t("password_label")} required />
            <Button
              type="submit"
              label={t("merchant_check_status")}
              loading={loading}
              className="justify-self-center rounded-full bg-primary-color px-8 py-2 text-white"
            />
          </Form>
        </Formik>
      </div>
    );
  }

  switch (application.status) {
    case "NEEDS_INFO":
      return (
        <>
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
              <FontAwesomeIcon icon={faCircleExclamation} />
              {t("merchant_status_needs_info_title")}
            </p>
            <p className="mt-1 whitespace-pre-line text-amber-800 dark:text-amber-200">
              {application.reviewNote}
            </p>
          </div>
          <MerchantApplicationForm
            heading={t("merchant_update_heading")}
            update={{
              email: credentials.email,
              password: credentials.password,
              values: fromApplication(application),
              onUpdated: () => {
                refetch();
                window.scrollTo({ top: 0, behavior: "smooth" });
              },
            }}
          />
        </>
      );
    case "APPROVED":
      return (
        <StatusCard icon={faCircleCheck} tone="text-green-600" title={t("merchant_status_approved_title")}>
          <p>{t("merchant_status_approved_body")}</p>
          {application.storeUsername ? (
            <p className="mt-3 rounded-lg bg-gray-50 p-3 font-medium dark:bg-gray-700">
              {t("merchant_store_username", { username: application.storeUsername })}
            </p>
          ) : null}
        </StatusCard>
      );
    case "REJECTED":
      return (
        <StatusCard icon={faCircleXmark} tone="text-red-500" title={t("merchant_status_rejected_title")}>
          {application.reviewNote ? <p className="whitespace-pre-line">{application.reviewNote}</p> : null}
        </StatusCard>
      );
    default:
      return (
        <StatusCard icon={faHourglassHalf} tone="text-amber-500" title={t("merchant_status_pending_title")}>
          <p>{t("merchant_status_pending_body", { store: application.store.name })}</p>
        </StatusCard>
      );
  }
};

export default ApplicationStatus;
