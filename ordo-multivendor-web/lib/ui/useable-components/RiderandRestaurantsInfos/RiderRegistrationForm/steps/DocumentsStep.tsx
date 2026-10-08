"use client";

import { getIn, useFormikContext } from "formik";
import { useTranslations } from "next-intl";

import { RiderRegistrationFormValues } from "@/lib/utils/interfaces";

import DocumentUploadField from "../DocumentUploadField";
import { documentsFor, isMotorized } from "../constants";
import { TextField } from "../fields";

// shared with the resubmit page, which passes `only` to show rejected documents
interface DocumentsStepProps {
  only?: string[];
}

const DocumentsStep = ({ only }: DocumentsStepProps) => {
  const t = useTranslations();
  const { values, errors, touched, setFieldValue } =
    useFormikContext<RiderRegistrationFormValues>();

  const motorized = isMotorized(values.vehicleType);
  const definitions = documentsFor(values.vehicleType).filter(
    (definition) => !only || only.includes(definition.key)
  );
  const errorFor = (path: string) =>
    getIn(touched, path) ? getIn(errors, path) : undefined;

  return (
    <div className="grid gap-5">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {motorized ? t("rider_docs_intro_motorized") : t("rider_docs_intro_bicycle")}
      </p>

      {definitions.map((definition) => {
        const base = `documents.${definition.key}`;
        const doc = values.documents[definition.key];

        return (
          <section
            key={definition.key}
            className="grid gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-600"
          >
            <DocumentUploadField
              label={t(definition.labelKey)}
              helperText={t(definition.helperKey)}
              value={doc.url}
              required={motorized}
              error={errorFor(`${base}.url`)}
              onChange={(url) => setFieldValue(`${base}.url`, url)}
            />

            {definition.withBack ? (
              <DocumentUploadField
                label={t("rider_doc_license_back")}
                value={doc.backUrl}
                onChange={(url) => setFieldValue(`${base}.backUrl`, url)}
              />
            ) : null}

            {definition.withNumber || definition.withExpiry ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {definition.withNumber ? (
                  <TextField
                    name={`${base}.number`}
                    label={t(definition.withNumber)}
                    required
                  />
                ) : null}
                {definition.withExpiry ? (
                  <TextField
                    name={`${base}.expiryDate`}
                    type="date"
                    label={t("rider_doc_expiry_date")}
                    required
                  />
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
};

export default DocumentsStep;
