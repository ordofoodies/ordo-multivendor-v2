"use client";
import ActionButton from "@/lib/ui/useable-components/action-button";
import CustomButton from "@/lib/ui/useable-components/button";
import RenderAspects from "@/lib/ui/useable-components/render-aspects";
import {
  IDetailedRatings,
  IRenderStepTwoProps,
} from "@/lib/utils/interfaces/ratings.interface";
import { twMerge } from "tailwind-merge";

// One row of 1-5 stars for a single part of the order
const StarRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-600">
    <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star}/5`}
          onClick={() => onChange(star)}
          className={twMerge(
            "text-2xl leading-none transition-transform hover:scale-110",
            star <= value ? "text-amber-400" : "text-gray-300 dark:text-gray-500"
          )}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);
import { useTranslations } from "next-intl";

// Render the second step - Aspects selection with option to add comment
const RenderStepTwo = ({
  detailed,
  setDetailed,
  showRider,
  riderName,
  selectedAspects,
  handleAspectToggle,
  handleNext,
  handleSubmitDebounced,
}: IRenderStepTwoProps) => {
  const t = useTranslations();
  return (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="w-full md:px-10 mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {t("rate_details_title")}
        </p>
        {(
          [
            ["foodRating", t("rate_food_label")],
            ...(showRider
              ? [["riderRating", riderName ? t("rate_rider_named_label", { name: riderName }) : t("rate_rider_label")]]
              : []),
            ["serviceRating", t("rate_ordo_service_label")],
          ] as [keyof IDetailedRatings, string][]
        ).map(([key, label]) => (
          <StarRow
            key={key}
            label={label}
            value={detailed[key]}
            onChange={(value) => setDetailed(key, value)}
          />
        ))}
      </div>
      <RenderAspects
        selectedAspects={selectedAspects}
        handleAspectToggle={handleAspectToggle}
      />
      <CustomButton
        label={t("add_a_comment_button")}
        onClick={handleNext} // Go to comment step
        className="!font-thin border border-gray-400  py-2 px-10 rounded-full bg-primary-light dark:bg-gray-500 dark:text-gray-300 text-gray-600 mb-4 flex items-center justify-center gap-2 transition-colors"
      />

      <ActionButton onClick={handleSubmitDebounced} primary>
        {t("submit_button")}
      </ActionButton>
    </div>
  );
};

export default RenderStepTwo;
