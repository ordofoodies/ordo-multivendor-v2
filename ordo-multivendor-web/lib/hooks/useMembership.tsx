"use client";

import { useQuery } from "@apollo/client";

import { MEMBERSHIP_PROGRAM, MY_MEMBERSHIP } from "@/lib/api/graphql/queries/membership";
import useUser from "./useUser";

export interface MembershipBenefits {
  freeDelivery: boolean;
  orderDiscountPercent: number;
  maxOrderDiscount: number;
}

export interface MembershipPlan extends MembershipBenefits {
  _id: string;
  name: string;
  price: number;
  interval: "day" | "week" | "month" | "year";
  intervalCount: number;
  badge?: string | null;
}

export interface MemberDiscounts {
  delivery: number;
  order: number;
}

const NO_DISCOUNT: MemberDiscounts = { delivery: 0, order: 0 };
const round2 = (n: number) => Math.round(n * 100) / 100;

// mirrors computeMembershipDiscounts in the API's helpers/membership.js
export const computeMemberDiscounts = (
  benefits: MembershipBenefits,
  subtotal: number,
  deliveryCharges: number,
  isPickUp: boolean
): MemberDiscounts => {
  const delivery = benefits.freeDelivery && !isPickUp && deliveryCharges > 0 ? deliveryCharges : 0;
  let order = 0;
  if (benefits.orderDiscountPercent > 0 && subtotal > 0) {
    order = round2((subtotal * benefits.orderDiscountPercent) / 100);
    if (benefits.maxOrderDiscount > 0) order = Math.min(order, benefits.maxOrderDiscount);
  }
  return { delivery, order };
};

export interface MembershipProgram {
  enabled: boolean;
  name: string;
  tagline?: string | null;
  perks?: string[] | null;
  freeDeliveryMinOrder: number;
  trialDays: number;
  plans: MembershipPlan[];
}

export interface MembershipRecord {
  _id: string;
  status: string;
  source: "stripe" | "admin";
  isActive: boolean;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean | null;
  planSnapshot?: Partial<MembershipPlan> | null;
  benefits: MembershipBenefits;
}

// program settings plus the signed-in customer's membership.
// cacheFirst is for components rendered many times per page (restaurant cards)
export default function useMembership({ cacheFirst = false }: { cacheFirst?: boolean } = {}) {
  const { isLoggedIn } = useUser();
  const fetchPolicy = cacheFirst ? "cache-first" : "cache-and-network";
  const program = useQuery<{ membershipProgram: MembershipProgram }>(MEMBERSHIP_PROGRAM, {
    fetchPolicy,
  });
  const mine = useQuery<{
    myMembership: {
      membership: MembershipRecord | null;
      totalSaved: number;
      ordersWithFreeDelivery: number;
      ordersWithSavings: number;
      trialAvailable: boolean;
    };
  }>(MY_MEMBERSHIP, { skip: !isLoggedIn, fetchPolicy });

  const settings = program.data?.membershipProgram;
  const membership = mine.data?.myMembership?.membership ?? null;
  const isMember = !!settings?.enabled && !!membership?.isActive;

  return {
    program: settings,
    membership,
    isMember,
    totalSaved: mine.data?.myMembership?.totalSaved ?? 0,
    ordersWithFreeDelivery: mine.data?.myMembership?.ordersWithFreeDelivery ?? 0,
    ordersWithSavings: mine.data?.myMembership?.ordersWithSavings ?? 0,
    trialAvailable: mine.data?.myMembership?.trialAvailable ?? true,
    loading: program.loading || mine.loading,
    refetch: () => Promise.all([program.refetch(), isLoggedIn ? mine.refetch() : null]),
    // what this member saves on an order; same rule the API applies
    memberDiscounts: (subtotal: number, deliveryCharges: number, isPickUp: boolean): MemberDiscounts =>
      isMember && membership && subtotal >= (settings?.freeDeliveryMinOrder ?? 0)
        ? computeMemberDiscounts(membership.benefits, subtotal, deliveryCharges, isPickUp)
        : NO_DISCOUNT,
  };
}
