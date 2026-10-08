"use client";

import { useRef, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  Form,
  Formik,
  validateYupSchema,
  yupToFormErrors,
} from "formik";
import { useTranslations } from "next-intl";
import { Button } from "primereact/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import * as Yup from "yup";

import { RESUBMIT_RIDER_DOCUMENTS } from "@/lib/api/graphql/mutations";
import { RIDER_APPLICATION } from "@/lib/api/graphql/queries/rider/application";
import useToast from "@/lib/hooks/useToast";
import {
  RiderDocumentKey,
  RiderRegistrationFormValues,
} from "@/lib/utils/interfaces";

import {
  documentsFor,
  emptyDocument,
  initialRiderValues,
  toDocumentsInput,
} from "./constants";
import { PasswordField, TextField } from "./fields";
import { stepValidationSchema } from "./validationSchema";
import DocumentsStep from "./steps/DocumentsStep";
import PhotoStep from "./steps/PhotoStep";
import FormErrorFocus from "./FormErrorFocus";
import { UploadTrackerProvider, useUploadTracker } from "./uploads";

interface ApplicationDocument {
  url?: string;
  originalUrl?: string;
  backUrl?: string;
  number?: string;
  expiryDate?: string;
  status?: string;
  rejectionReason?: string;
}

interface RiderApplication {
  name: string;
  vehicleType: string;
  riderRequestStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  rejectionReason?: string;
  vehicleDetails?: { number?: string };
  documents?: Record<string, ApplicationDocument | null>;
}

interface Credentials {
  email: string;
  password: string;
}

const isExpired = (date?: string) => !!date && new Date(date) < new Date();

// documents the rider has to fix: rejected, missing, or expired
const documentsToFix = (application: RiderApplication) => {
  const docs = application.documents ?? {};
  const keys = documentsFor(application.vehicleType)
    .map((definition) => definition.key)
    .filter((key) => {
      const doc = docs[key];
      return !doc?.url || doc.status === "REJECTED" || isExpired(doc.expiryDate);
    });
  const photo = docs.profilePhoto;
  const fixPhoto = !photo?.originalUrl || photo.status === "REJECTED";
  return { keys, fixPhoto };
};

const toFormValues = (application: RiderApplication): RiderRegistrationFormValues => {
  const docs = application.documents ?? {};
  const documents = { ...initialRiderValues.documents };
  (Object.keys(documents) as RiderDocumentKey[]).forEach((key) => {
    const doc = docs[key];
    documents[key] = doc
      ? {
          url: doc.url ?? "",
          backUrl: doc.backUrl ?? "",
          number: doc.number ?? "",
          expiryDate: doc.expiryDate ? doc.expiryDate.slice(0, 10) : "",
        }
      : emptyDocument();
  });
  return {
    ...initialRiderValues,
    vehicleType: application.vehicleType,
    vehicleNumber: application.vehicleDetails?.number ?? "",
    profilePhoto: docs.profilePhoto?.originalUrl ?? "",
    documents,
  };
};

const StatusMessage = ({
  icon,
  tone,
  title,
  body,
}: {
  icon: typeof faCircleCheck;
  tone: string;
  title: string;
  body: string;
}) => (
  <div className="flex flex-col items-center gap-3 py-4 text-center">
    <FontAwesomeIcon icon={icon} className={`text-4xl ${tone}`} />
    <h3 className="text-lg font-semibold dark:text-gray-100">{title}</h3>
    <p className="max-w-sm text-sm text-gray-600 dark:text-gray-300">{body}</p>
  </div>
);

const ResubmitDocumentsForm = () => {
  const t = useTranslations();
  const { showToast } = useToast();
  const tracker = useUploadTracker();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [resubmitted, setResubmitted] = useState(false);
  const [fetchApplication, { data, loading }] = useLazyQuery(RIDER_APPLICATION, {
    fetchPolicy: "network-only",
  });
  const [resubmit] = useMutation(RESUBMIT_RIDER_DOCUMENTS);
  const latestValues = useRef<RiderRegistrationFormValues | null>(null);

  const application: RiderApplication | undefined = data?.riderApplication;

  const errorMessage = (error: any) =>
    error?.graphQLErrors?.[0]?.message || error?.message || t("failed_to_submit_form_please_try_again");

  const handleSignIn = async (values: Credentials) => {
    const result = await fetchApplication({ variables: values });
    if (result.error) {
      showToast({ type: "error", title: t("toast_error"), message: errorMessage(result.error), duration: 4000 });
      return;
    }
    setCredentials(values);
  };

  if (!credentials || !application) {
    return (
      <Formik<Credentials>
        initialValues={{ email: "", password: "" }}
        validationSchema={Yup.object({
          email: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
          password: Yup.string().required(t("passwordRequired")),
        })}
        onSubmit={handleSignIn}
      >
        <Form className="grid gap-5" noValidate>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("rider_resubmit_intro")}</p>
          <TextField name="email" type="email" label={t("email_label")} required />
          <PasswordField name="password" label={t("password_label")} required />
          <Button
            type="submit"
            label={t("rider_resubmit_check")}
            loading={loading}
            className="justify-self-center rounded-full bg-primary-color px-8 py-2 text-white"
          />
        </Form>
      </Formik>
    );
  }

  if (resubmitted) {
    return (
      <StatusMessage
        icon={faCircleCheck}
        tone="text-green-600"
        title={t("rider_resubmit_done_title")}
        body={t("rider_resubmit_done_body")}
      />
    );
  }

  if (application.riderRequestStatus === "PENDING") {
    return (
      <StatusMessage
        icon={faHourglassHalf}
        tone="text-amber-500"
        title={t("rider_status_pending_title")}
        body={t("rider_status_pending_body")}
      />
    );
  }

  if (application.riderRequestStatus === "ACCEPTED") {
    return (
      <StatusMessage
        icon={faCircleCheck}
        tone="text-green-600"
        title={t("rider_status_accepted_title")}
        body={t("rider_status_accepted_body")}
      />
    );
  }

  const { keys, fixPhoto } = documentsToFix(application);
  // rejected for another reason: let the rider replace anything
  const editableKeys = keys.length || fixPhoto
    ? keys
    : documentsFor(application.vehicleType).map((definition) => definition.key);
  const original = toFormValues(application);
  const rejectedDocs = Object.entries(application.documents ?? {}).filter(
    ([, doc]) => doc?.status === "REJECTED"
  );

  const validate = async (values: RiderRegistrationFormValues) => {
    try {
      await validateYupSchema(values, stepValidationSchema(t, "documents", values.vehicleType));
      if (fixPhoto) await validateYupSchema(values, stepValidationSchema(t, "photo", values.vehicleType));
      return {};
    } catch (error) {
      return yupToFormErrors(error);
    }
  };

  const handleResubmit = async (
    submitted: RiderRegistrationFormValues,
    { validateForm }: { validateForm: () => Promise<Record<string, unknown>> }
  ) => {
    // let background uploads finish, then make sure none of them failed
    await tracker?.waitForAll();
    if (Object.keys(await validateForm()).length) return;
    const values = latestValues.current ?? submitted;

    // only send what changed
    const input = toDocumentsInput(values) as Record<string, any>;
    const changed: Record<string, unknown> = {};
    Object.entries(input).forEach(([key, value]) => {
      if (key === "profilePhoto") {
        if (value !== original.profilePhoto) changed[key] = value;
        return;
      }
      const before = original.documents[key as RiderDocumentKey];
      if (
        value.url !== before.url ||
        (value.backUrl ?? "") !== before.backUrl ||
        (value.number ?? "") !== before.number ||
        (value.expiryDate ?? "") !== before.expiryDate
      ) {
        changed[key] = value;
      }
    });

    if (!Object.keys(changed).length) {
      showToast({ type: "error", title: t("toast_error"), message: t("rider_resubmit_nothing_changed"), duration: 4000 });
      return;
    }

    try {
      await resubmit({ variables: { ...credentials, documents: changed } });
      setResubmitted(true);
    } catch (error) {
      showToast({ type: "error", title: t("toast_error"), message: errorMessage(error), duration: 5000 });
    }
  };

  return (
    <div className="grid gap-5">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/40">
        <p className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {t("rider_status_rejected_title")}
        </p>
        {application.rejectionReason ? (
          <p className="mt-1 text-red-700 dark:text-red-300">{application.rejectionReason}</p>
        ) : null}
        {rejectedDocs.length ? (
          <ul className="mt-2 list-disc ps-5 text-red-700 dark:text-red-300">
            {rejectedDocs.map(([key, doc]) => (
              <li key={key}>
                {key === "profilePhoto"
                  ? t("rider_photo_label")
                  : t(documentsFor(application.vehicleType).find((d) => d.key === key)?.labelKey ?? key)}
                {doc?.rejectionReason ? `: ${doc.rejectionReason}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Formik initialValues={original} validate={validate} onSubmit={handleResubmit}>
        {({ isSubmitting, values }) => (
          <Form className="grid gap-6" noValidate>
            <LatestValues values={values} target={latestValues} />
            {fixPhoto ? <PhotoStep /> : null}
            {editableKeys.length ? <DocumentsStep only={editableKeys} /> : null}
            <FormErrorFocus />
            <Button
              type="submit"
              label={t("rider_resubmit_submit")}
              loading={isSubmitting}
              className="justify-self-center rounded-full bg-primary-color px-8 py-2 text-white"
            />
          </Form>
        )}
      </Formik>
    </div>
  );
};

// keeps the newest form values reachable after awaiting uploads
const LatestValues = ({
  values,
  target,
}: {
  values: RiderRegistrationFormValues;
  target: React.MutableRefObject<RiderRegistrationFormValues | null>;
}) => {
  target.current = values;
  return null;
};

const ResubmitDocuments = () => (
  <UploadTrackerProvider>
    <ResubmitDocumentsForm />
  </UploadTrackerProvider>
);

export default ResubmitDocuments;
