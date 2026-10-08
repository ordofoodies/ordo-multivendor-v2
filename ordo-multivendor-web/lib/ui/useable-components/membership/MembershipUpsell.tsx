"use client";

import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { computeMemberDiscounts, MembershipProgram } from "@/lib/hooks/useMembership";
import { formatPlanPrice } from "./format";

interface MembershipUpsellProps {
  program: MembershipProgram;
  deliveryFee: number;
  // items subtotal after coupon; the API checks this against freeDeliveryMinOrder
  subtotal: number;
  isPickUp: boolean;
  currencySymbol: string;
}

// shown at checkout to non-members: what the best plan would save on this order
const MembershipUpsell = ({ program, deliveryFee, subtotal, isPickUp, currencySymbol }: MembershipUpsellProps) => {
  const t = useTranslations();
  if (!program.enabled) return null;
  // joining wouldn't change this order, so don't promise a saving
  if (subtotal < (program.freeDeliveryMinOrder || 0)) return null;

  const best = program.plans
    .map((plan) => {
      const d = computeMemberDiscounts(plan, subtotal, deliveryFee, isPickUp);
      return { plan, saving: d.delivery + d.order };
    })
    .filter((x) => x.saving > 0)
    .sort((a, b) => b.saving - a.saving || a.plan.price - b.plan.price)[0];
  if (!best) return null;

  return (
    <Link
      href="/membership"
      className="mb-3 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm transition hover:border-primary-color dark:border-gray-600 dark:bg-gray-700"
    >
      <FontAwesomeIcon icon={faCrown} className="text-primary-color" />
      <span className="flex-1 text-gray-800 dark:text-gray-100">
        {t("membership_upsell_save", {
          name: program.name,
          amount: `${currencySymbol}${best.saving.toFixed(2)}`,
          price: formatPlanPrice(t, best.plan, currencySymbol),
        })}
      </span>
      <span className="font-semibold text-primary-color">{t("membership_join")}</span>
    </Link>
  );
};

export default MembershipUpsell;
