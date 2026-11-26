import { useContext } from 'react'
import { gql, useQuery } from '@apollo/client'
import UserContext from '../context/User'

const round2 = (n) => Math.round(n * 100) / 100

// Share of the item subtotal taken off by the membership discount (0..1).
export const memberDiscountRatio = (memberOrderDiscount, itemsSubtotal) =>
  memberOrderDiscount > 0 && itemsSubtotal > 0 ? Math.min(1, memberOrderDiscount / itemsSubtotal) : 0

// Percentage actually saved; differs from the plan's percent when the discount is capped.
export const memberPercentSaved = (ratio) => Math.round(ratio * 100)

export const discountedPrice = (price, ratio) => round2(price * (1 - ratio))

// Same formula the API uses on delivery (helpers/process-loyalty-chain.js):
// round(order total × tier's directOrderPointsPercent / 100)
export const pointsForOrder = (orderTotal, pointsPercent) =>
  pointsPercent > 0 && orderTotal > 0 ? Math.round((orderTotal * pointsPercent) / 100) : 0

const POINTS_RATE = gql`
  query CustomerPointsRate {
    fetchUserLoyaltyData {
      tier {
        _id
        directOrderPointsPercent
      }
    }
  }
`

// The signed-in customer's points-per-order percentage (from their loyalty tier, set in admin).
export const usePointsPercent = () => {
  const { isLoggedIn } = useContext(UserContext)
  const { data } = useQuery(POINTS_RATE, { skip: !isLoggedIn, fetchPolicy: 'cache-and-network' })
  return data?.fetchUserLoyaltyData?.tier?.directOrderPointsPercent || 0
}
