import { MembershipBenefits, MembershipPlan } from "@/lib/hooks/useMembership";

type T = (key: string, values?: Record<string, string | number>) => string;

// "RD$299 / month", "RD$799 / 3 months"
export const formatPlanPrice = (
  t: T,
  plan: Pick<MembershipPlan, "price" | "interval" | "intervalCount">,
  currencySymbol: string
) =>
  `${currencySymbol}${plan.price.toLocaleString()} / ${t(`membership_per_${plan.interval}`, {
    count: plan.intervalCount || 1,
  })}`;

// ["Free delivery", "10% off every order (up to RD$100)"]
export const benefitLines = (t: T, benefits: MembershipBenefits, currencySymbol: string) =>
  [
    benefits.freeDelivery ? t("membership_benefit_free_delivery") : null,
    benefits.orderDiscountPercent > 0
      ? benefits.maxOrderDiscount > 0
        ? t("membership_benefit_percent_capped", {
            percent: benefits.orderDiscountPercent,
            max: `${currencySymbol}${benefits.maxOrderDiscount.toLocaleString()}`,
          })
        : t("membership_benefit_percent", { percent: benefits.orderDiscountPercent })
      : null,
  ].filter((line): line is string => !!line);

// short label for badges: "Free delivery" / "10% off"
export const benefitBadge = (t: T, benefits: MembershipBenefits) =>
  benefits.freeDelivery
    ? t("membership_card_badge")
    : t("membership_badge_percent", { percent: benefits.orderDiscountPercent });
