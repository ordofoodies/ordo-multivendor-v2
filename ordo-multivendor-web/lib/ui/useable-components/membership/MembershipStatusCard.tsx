"use client";

import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Button } from "primereact/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faMotorcycle } from "@fortawesome/free-solid-svg-icons";

import { CANCEL_MEMBERSHIP, RESUME_MEMBERSHIP } from "@/lib/api/graphql/queries/membership";
import { useConfig } from "@/lib/context/configuration/configuration.context";
import { MembershipRecord } from "@/lib/hooks/useMembership";
import useToast from "@/lib/hooks/useToast";
import { benefitLines } from "./format";

export const membershipErrorMessage = (error: unknown, fallback: string) =>
  (error as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.[0]?.message ?? fallback;

interface MembershipStatusCardProps {
  membership: MembershipRecord;
  programName: string;
  totalSaved: number;
  ordersWithSavings: number;
  refetch: () => Promise<unknown>;
  className?: string;
}

// plan, renewal date, savings and cancel/resume; used on /membership and /profile/membership
const MembershipStatusCard = ({
  membership,
  programName,
  totalSaved,
  ordersWithSavings,
  refetch,
  className = "",
}: MembershipStatusCardProps) => {
  const t = useTranslations();
  const { showToast } = useToast();
  const { CURRENCY_SYMBOL } = useConfig();
  const [cancel, { loading: canceling }] = useMutation(CANCEL_MEMBERSHIP);
  const [resume, { loading: resuming }] = useMutation(RESUME_MEMBERSHIP);

  const toggleRenewal = async () => {
    try {
      await (membership.cancelAtPeriodEnd ? resume() : cancel());
      await refetch();
    } catch (error) {
      showToast({
        type: "error",
        title: t("toast_error"),
        message: membershipErrorMessage(error, t("membership_update_failed")),
      });
    }
  };

  const endDate = new Date(membership.currentPeriodEnd).toLocaleDateString();

  return (
    <section className={`rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("membership_your_plan")}</p>
          <p className="text-lg font-semibold dark:text-white">
            {membership.planSnapshot?.name ?? programName}
          </p>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          {membership.status === "trialing" ? t("membership_status_trial") : t("membership_status_active")}
        </span>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        {membership.source === "admin"
          ? t("membership_granted_until", { date: endDate })
          : membership.cancelAtPeriodEnd
            ? t("membership_ends_on", { date: endDate })
            : membership.status === "trialing"
              ? t("membership_trial_ends", { date: endDate })
              : t("membership_renews_on", { date: endDate })}
      </p>

      <ul className="mt-3 grid gap-1">
        {benefitLines(t, membership.benefits, CURRENCY_SYMBOL).map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <FontAwesomeIcon icon={faCheck} className="mt-0.5 text-green-600" />
            {line}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-orange-50 p-4 dark:bg-gray-700">
        <FontAwesomeIcon icon={faMotorcycle} className="text-xl text-primary-color" />
        <p className="text-sm text-gray-800 dark:text-gray-100">
          {t("membership_savings", {
            amount: `${CURRENCY_SYMBOL}${totalSaved.toFixed()}`,
            count: ordersWithSavings,
          })}
        </p>
      </div>

      {membership.source === "stripe" ? (
        <Button
          type="button"
          onClick={toggleRenewal}
          loading={canceling || resuming}
          label={membership.cancelAtPeriodEnd ? t("membership_resume") : t("membership_cancel")}
          className={`mt-5 w-full rounded-full p-2 text-sm font-medium ${
            membership.cancelAtPeriodEnd
              ? "bg-primary-color text-white"
              : "border border-gray-300 bg-transparent text-gray-700 dark:text-gray-200"
          }`}
        />
      ) : null}
    </section>
  );
};

export default MembershipStatusCard;
