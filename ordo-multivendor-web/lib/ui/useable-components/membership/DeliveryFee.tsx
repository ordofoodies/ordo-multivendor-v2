"use client";

import { useTranslations } from "next-intl";

import MemberBadge from "./MemberBadge";

interface DeliveryFeeProps {
  amount: number;
  free: boolean;
  currencySymbol: string;
  // program name shown as a member badge when the fee is waived
  badgeLabel?: string;
  className?: string;
}

// delivery fee in the checkout summary; struck through when membership covers it
const DeliveryFee = ({ amount, free, currencySymbol, badgeLabel, className = "" }: DeliveryFeeProps) => {
  const t = useTranslations();
  if (!free) {
    return (
      <span className={className}>
        {currencySymbol}
        {amount.toFixed()}
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {badgeLabel ? <MemberBadge label={badgeLabel} /> : null}
      <span className="text-gray-400 line-through">
        {currencySymbol}
        {amount.toFixed()}
      </span>
      <span className="font-semibold text-green-600">{t("membership_free")}</span>
    </span>
  );
};

export default DeliveryFee;
