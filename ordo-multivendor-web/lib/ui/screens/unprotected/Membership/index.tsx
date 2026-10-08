"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "primereact/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCrown } from "@fortawesome/free-solid-svg-icons";

import {
  CONFIRM_MEMBERSHIP_CHECKOUT,
  START_MEMBERSHIP_CHECKOUT,
} from "@/lib/api/graphql/queries/membership";
import { useConfig } from "@/lib/context/configuration/configuration.context";
import { useAuth } from "@/lib/context/auth/auth.context";
import useMembership, { MembershipPlan } from "@/lib/hooks/useMembership";
import useToast from "@/lib/hooks/useToast";
import useUser from "@/lib/hooks/useUser";
import { benefitLines, formatPlanPrice } from "@/lib/ui/useable-components/membership/format";
import MembershipStatusCard, {
  membershipErrorMessage as errorMessage,
} from "@/lib/ui/useable-components/membership/MembershipStatusCard";

const Membership = () => {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { CURRENCY_SYMBOL } = useConfig();
  const { isLoggedIn } = useUser();
  const { setIsAuthModalVisible } = useAuth();
  const {
    program,
    membership,
    isMember,
    totalSaved,
    ordersWithSavings,
    trialAvailable,
    loading,
    refetch,
  } = useMembership();
  const [joiningPlan, setJoiningPlan] = useState<string | null>(null);
  const confirmedSession = useRef<string | null>(null);

  const [startCheckout] = useMutation(START_MEMBERSHIP_CHECKOUT);
  const [confirmCheckout, { loading: confirming }] = useMutation(CONFIRM_MEMBERSHIP_CHECKOUT);

  // back from Stripe: activate right away instead of waiting for the webhook
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (searchParams.get("canceled")) {
      showToast({ type: "info", title: t("membership_title"), message: t("membership_checkout_canceled") });
      router.replace("/membership");
      return;
    }
    if (!sessionId || !isLoggedIn || confirmedSession.current === sessionId) return;
    confirmedSession.current = sessionId;
    confirmCheckout({ variables: { sessionId } })
      .then(async () => {
        await refetch();
        showToast({ type: "success", title: t("membership_welcome_title"), message: t("membership_welcome_body") });
      })
      .catch((error) =>
        showToast({ type: "error", title: t("toast_error"), message: errorMessage(error, t("membership_confirm_failed")) })
      )
      .finally(() => router.replace("/membership"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoggedIn]);

  const join = async (plan: MembershipPlan) => {
    if (!isLoggedIn) {
      setIsAuthModalVisible(true);
      return;
    }
    setJoiningPlan(plan._id);
    try {
      const { data } = await startCheckout({ variables: { planId: plan._id } });
      window.location.href = data.startMembershipCheckout;
    } catch (error) {
      setJoiningPlan(null);
      showToast({ type: "error", title: t("toast_error"), message: errorMessage(error, t("membership_checkout_failed")) });
    }
  };

  if (loading && !program) {
    return <div className="mx-auto my-20 h-64 max-w-3xl animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  if (!program?.enabled) {
    return (
      <div className="mx-auto my-20 max-w-xl px-4 text-center">
        <FontAwesomeIcon icon={faCrown} className="text-4xl text-primary-color" />
        <h1 className="mt-4 text-2xl font-bold dark:text-white">{t("membership_unavailable_title")}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{t("membership_unavailable_body")}</p>
      </div>
    );
  }

  // each plan lists its own benefits; this is the program-wide extras
  const perks = [
    ...(program.perks ?? []),
    ...(program.freeDeliveryMinOrder > 0
      ? [t("membership_min_order_note", { amount: `${CURRENCY_SYMBOL}${program.freeDeliveryMinOrder}` })]
      : []),
  ];

  return (
    <div className="w-screen px-4 pb-16">
      <section className="mx-auto mt-10 max-w-3xl text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl text-primary-color dark:bg-gray-700">
          <FontAwesomeIcon icon={faCrown} />
        </span>
        <h1 className="mt-4 text-[32px] font-bold leading-tight text-primary-color md:text-[44px]">{program.name}</h1>
        {program.tagline ? (
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{program.tagline}</p>
        ) : null}
        <ul className={`mx-auto mt-6 grid max-w-md gap-2 text-start ${perks.length ? "" : "hidden"}`}>
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-gray-800 dark:text-gray-100">
              <FontAwesomeIcon icon={faCheck} className="mt-1 text-green-600" />
              {perk}
            </li>
          ))}
        </ul>
      </section>

      {isMember && membership ? (
        <MembershipStatusCard
          membership={membership}
          programName={program.name}
          totalSaved={totalSaved}
          ordersWithSavings={ordersWithSavings}
          refetch={refetch}
          className="mx-auto mt-10 max-w-xl"
        />
      ) : (
        <section className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {program.plans.map((plan) => (
            <div
              key={plan._id}
              className="relative flex flex-col rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {plan.badge ? (
                <span className="absolute -top-3 end-4 rounded-full bg-primary-color px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              ) : null}
              <p className="font-semibold text-gray-900 dark:text-white">{plan.name}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {formatPlanPrice(t, plan, CURRENCY_SYMBOL)}
              </p>
              <ul className="mt-4 grid gap-1.5">
                {benefitLines(t, plan, CURRENCY_SYMBOL).map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <FontAwesomeIcon icon={faCheck} className="mt-0.5 text-green-600" />
                    {line}
                  </li>
                ))}
              </ul>
              {program.trialDays > 0 && trialAvailable ? (
                <p className="mt-1 text-sm font-medium text-green-600">
                  {t("membership_trial_offer", { days: program.trialDays })}
                </p>
              ) : null}
              <Button
                type="button"
                onClick={() => join(plan)}
                loading={joiningPlan === plan._id || confirming}
                disabled={!!joiningPlan}
                label={
                  program.trialDays > 0 && trialAvailable
                    ? t("membership_start_trial")
                    : t("membership_join")
                }
                className="mt-6 w-full rounded-full bg-primary-color p-2 text-[16px] font-medium text-white"
              />
            </div>
          ))}
          <p className="text-center text-xs text-gray-500 sm:col-span-2 dark:text-gray-400">
            {t("membership_fine_print")}
          </p>
        </section>
      )}
    </div>
  );
};

export default Membership;
