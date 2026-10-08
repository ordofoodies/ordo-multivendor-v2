"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getIn, useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { InputSwitch } from "primereact/inputswitch";
import { InputTextarea } from "primereact/inputtextarea";

import DocumentUploadField from "../../RiderRegistrationForm/DocumentUploadField";
import { FieldError, FieldLabel } from "../../RiderRegistrationForm/fields";
import { MAX_MENU_PHOTOS, MerchantFormValues } from "../constants";

const timeInput =
  "w-[7.5rem] rounded-lg border-2 border-gray-100 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-40";

const HoursStep = () => {
  const t = useTranslations();
  const { values, errors, touched, setFieldValue } = useFormikContext<MerchantFormValues>();
  const hoursError = typeof errors.hours === "string" ? errors.hours : undefined;

  const copyToAll = () => {
    const first = values.hours.find((day) => day.open) ?? values.hours[0];
    setFieldValue(
      "hours",
      values.hours.map((day) => ({ ...day, open: true, start: first.start, end: first.end }))
    );
  };

  const setMenuPhoto = (index: number, url: string) => {
    // slots are never removed, so an upload still in flight can't land in
    // the wrong slot; empty slots are dropped when submitting
    setFieldValue(`menuPhotos.${index}`, url);
  };

  return (
    <div className="grid gap-6">
      <section>
        <div className="flex items-center justify-between">
          <FieldLabel label={t("merchant_hours_heading")} required />
          <button type="button" onClick={copyToAll} className="text-xs font-medium text-primary-color">
            {t("merchant_hours_copy")}
          </button>
        </div>
        <ul className="mt-3 divide-y rounded-xl border border-gray-200 dark:divide-gray-600 dark:border-gray-600">
          {values.hours.map((day, index) => {
            const rowError = (field: string) =>
              getIn(touched, `hours.${index}.${field}`) ? getIn(errors, `hours.${index}.${field}`) : undefined;
            const error = rowError("start") || rowError("end");
            return (
              <li key={day.day} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <InputSwitch
                  checked={day.open}
                  onChange={(e) => setFieldValue(`hours.${index}.open`, !!e.value)}
                  aria-label={t(`merchant_day_${day.day.toLowerCase()}`)}
                />
                <span className="w-24 text-sm font-medium dark:text-gray-100">
                  {t(`merchant_day_${day.day.toLowerCase()}`)}
                </span>
                {day.open ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => setFieldValue(`hours.${index}.start`, e.target.value)}
                      className={timeInput}
                      aria-label={t("merchant_opens")}
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => setFieldValue(`hours.${index}.end`, e.target.value)}
                      className={timeInput}
                      aria-label={t("merchant_closes")}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{t("merchant_closed")}</span>
                )}
                {error ? <small className="p-error w-full text-xs">{error}</small> : null}
              </li>
            );
          })}
        </ul>
        {hoursError ? <small className="p-error text-sm">{hoursError}</small> : null}
      </section>

      <section className="grid gap-3">
        <div>
          <FieldLabel label={t("merchant_menu_heading")} />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("merchant_menu_hint")}</p>
        </div>
        {values.menuPhotos.map((url, index) => (
          <DocumentUploadField
            key={index}
            label={t("merchant_menu_photo", { number: index + 1 })}
            value={url}
            onChange={(next) => setMenuPhoto(index, next)}
          />
        ))}
        {values.menuPhotos.length < MAX_MENU_PHOTOS ? (
          <button
            type="button"
            onClick={() => setFieldValue("menuPhotos", [...values.menuPhotos, ""])}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-primary-color dark:border-gray-600"
          >
            <FontAwesomeIcon icon={faPlus} />
            {t("merchant_menu_add")}
          </button>
        ) : null}
      </section>

      <section>
        <FieldLabel label={t("merchant_notes")} />
        <InputTextarea
          value={values.notes}
          onChange={(e) => setFieldValue("notes", e.target.value)}
          rows={3}
          placeholder={t("merchant_notes_placeholder")}
          maxLength={500}
          className="mt-2 w-full rounded-lg border-2 border-gray-100 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <FieldError name="notes" />
      </section>
    </div>
  );
};

export default HoursStep;
