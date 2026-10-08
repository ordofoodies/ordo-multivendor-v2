import { useContext } from 'react'
import { useQuery } from '@apollo/client'

import UserContext from '../../context/User'
import { MEMBERSHIP_PROGRAM, MY_MEMBERSHIP } from '../../apollo/membership'

const NO_DISCOUNT = { delivery: 0, order: 0 }
const round2 = (n) => Math.round(n * 100) / 100

// mirrors computeMembershipDiscounts in the API's helpers/membership.js
export const computeMemberDiscounts = (benefits, subtotal, deliveryCharges, isPickup) => {
  if (!benefits) return NO_DISCOUNT
  const delivery = benefits.freeDelivery && !isPickup && deliveryCharges > 0 ? deliveryCharges : 0
  let order = 0
  if (benefits.orderDiscountPercent > 0 && subtotal > 0) {
    order = round2((subtotal * benefits.orderDiscountPercent) / 100)
    if (benefits.maxOrderDiscount > 0) order = Math.min(order, benefits.maxOrderDiscount)
  }
  return { delivery, order }
}

// program settings plus the signed-in customer's membership.
// cacheFirst is for components rendered many times (restaurant cards)
export default function useMembership({ cacheFirst = false } = {}) {
  const { isLoggedIn } = useContext(UserContext)
  const fetchPolicy = cacheFirst ? 'cache-first' : 'cache-and-network'
  const program = useQuery(MEMBERSHIP_PROGRAM, { fetchPolicy })
  const mine = useQuery(MY_MEMBERSHIP, { skip: !isLoggedIn, fetchPolicy })

  const settings = program.data?.membershipProgram
  const membership = mine.data?.myMembership?.membership ?? null
  const isMember = !!settings?.enabled && !!membership?.isActive

  return {
    program: settings,
    membership,
    isMember,
    totalSaved: mine.data?.myMembership?.totalSaved ?? 0,
    ordersWithSavings: mine.data?.myMembership?.ordersWithSavings ?? 0,
    trialAvailable: mine.data?.myMembership?.trialAvailable ?? true,
    loading: program.loading || mine.loading,
    refetch: () => Promise.all([program.refetch(), isLoggedIn ? mine.refetch() : null]),
    // what this member saves on an order; same rule the API applies
    memberDiscounts: (subtotal, deliveryCharges, isPickup) =>
      isMember && subtotal >= (settings?.freeDeliveryMinOrder ?? 0)
        ? computeMemberDiscounts(membership.benefits, subtotal, deliveryCharges, isPickup)
        : NO_DISCOUNT
  }
}

// ["Free delivery on every order", "10% off every order (up to $100)"]
export const benefitLines = (t, benefits, currencySymbol) =>
  [
    benefits?.freeDelivery ? t('membershipBenefitFreeDelivery') : null,
    benefits?.orderDiscountPercent > 0
      ? benefits.maxOrderDiscount > 0
        ? t('membershipBenefitPercentCapped', {
            percent: benefits.orderDiscountPercent,
            max: `${currencySymbol}${benefits.maxOrderDiscount}`
          })
        : t('membershipBenefitPercent', { percent: benefits.orderDiscountPercent })
      : null
  ].filter(Boolean)

// "RD$299 / month", "RD$799 / 3 months"
export const planPriceText = (t, plan, currencySymbol) => {
  const count = plan?.intervalCount || 1
  // separate singular/plural keys: this app's i18next runs in v3 plural mode
  const unit = t(`membershipUnit_${plan?.interval}${count > 1 ? 's' : ''}`)
  return `${currencySymbol}${plan?.price} / ${count > 1 ? `${count} ${unit}` : unit}`
}
