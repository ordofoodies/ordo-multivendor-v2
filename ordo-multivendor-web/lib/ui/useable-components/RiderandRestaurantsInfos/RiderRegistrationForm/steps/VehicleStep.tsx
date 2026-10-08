"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";

import { RiderRegistrationFormValues } from "@/lib/utils/interfaces";

import { isMotorized, vehicleOptions } from "../constants";
import { FieldError, FieldLabel, TextField } from "../fields";
import ZoneLocationPicker from "../ZoneLocationPicker";

const VehicleStep = () => {
  const t = useTranslations();
  const { values, setFieldValue } =
    useFormikContext<RiderRegistrationFormValues>();
  return (
    <div className="grid gap-5">
      <div>
        <FieldLabel label={t("vehicle_type_label")} required />
        <div className="mt-2 grid grid-cols-2 gap-3">
          {vehicleOptions.map((option) => {
            const isSelected = values.vehicleType === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={isSelected}
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
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {isMotorized(values.vehicleType)
            ? t("rider_vehicle_motorized_hint")
            : t("rider_vehicle_bicycle_hint")}
        </p>
        <FieldError name="vehicleType" />
      </div>

      {isMotorized(values.vehicleType) ? (
        <TextField
          name="vehicleNumber"
          label={t("vehicle_number_label")}
          required
        />
      ) : null}

      <ZoneLocationPicker />
    </div>
  );
};

export default VehicleStep;
