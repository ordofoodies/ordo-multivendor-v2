"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";

import useMembership from "@/lib/hooks/useMembership";
import MembershipStatusCard from "@/lib/ui/useable-components/membership/MembershipStatusCard";

export default function MembershipProfileScreen() {
  const t = useTranslations();
  const { program, membership, isMember, totalSaved, ordersWithSavings, loading, refetch } =
    useMembership();

  if (loading && !program) {
    return <div className="mx-auto my-10 h-48 max-w-xl animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;
  }

  if (isMember && membership && program) {
    return (
      <MembershipStatusCard
        membership={membership}
        programName={program.name}
        totalSaved={totalSaved}
        ordersWithSavings={ordersWithSavings}
        refetch={refetch}
        className="mx-auto my-6 max-w-xl"
      />
    );
  }

  return (
    <div className="mx-auto my-10 max-w-xl rounded-2xl border border-gray-100 p-8 text-center dark:border-gray-700">
      <FontAwesomeIcon icon={faCrown} className="text-3xl text-primary-color" />
      <h2 className="mt-3 text-xl font-semibold dark:text-white">
        {program?.enabled ? t("membership_not_member_title", { name: program.name }) : t("membership_unavailable_title")}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {program?.enabled ? t("membership_not_member_body") : t("membership_unavailable_body")}
      </p>
      {program?.enabled ? (
        <Link
          href="/membership"
          className="mt-5 inline-block rounded-full bg-primary-color px-6 py-2 text-sm font-medium text-white"
        >
          {t("membership_see_plans")}
        </Link>
      ) : null}
    </div>
  );
}
