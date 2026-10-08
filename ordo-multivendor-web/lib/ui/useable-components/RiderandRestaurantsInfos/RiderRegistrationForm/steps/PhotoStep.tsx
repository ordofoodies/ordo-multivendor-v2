"use client";

import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getIn, useFormikContext } from "formik";
import { useTranslations } from "next-intl";

import { RiderRegistrationFormValues } from "@/lib/utils/interfaces";

import DocumentUploadField from "../DocumentUploadField";

const PhotoStep = () => {
  const t = useTranslations();
  const { values, errors, touched, setFieldValue } =
    useFormikContext<RiderRegistrationFormValues>();

  const dos = ["rider_photo_do_plain", "rider_photo_do_face", "rider_photo_do_light"];
  const donts = ["rider_photo_dont_hat", "rider_photo_dont_group"];

  return (
    <div className="grid gap-5">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("rider_photo_intro")}
      </p>

      <ul className="grid gap-2 rounded-xl bg-orange-50 p-4 text-sm dark:bg-gray-700/60">
        {dos.map((key) => (
          <li key={key} className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
            <FontAwesomeIcon icon={faCheck} className="mt-1 text-green-600" />
            {t(key)}
          </li>
        ))}
        {donts.map((key) => (
          <li key={key} className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
            <FontAwesomeIcon icon={faXmark} className="mt-1 text-red-500" />
            {t(key)}
          </li>
        ))}
      </ul>

      <DocumentUploadField
        label={t("rider_photo_label")}
        value={values.profilePhoto}
        aspect="square"
        capture="user"
        // the branded photo is rendered at 800px, so 1024 is plenty
        maxDimension={1024}
        required
        helperText={t("rider_photo_background_note")}
        error={
          getIn(touched, "profilePhoto") ? getIn(errors, "profilePhoto") : undefined
        }
        onChange={(url) => setFieldValue("profilePhoto", url)}
      />
    </div>
  );
};

export default PhotoStep;
