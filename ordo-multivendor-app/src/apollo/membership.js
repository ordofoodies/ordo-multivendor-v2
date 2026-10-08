import gql from 'graphql-tag'

// Membership (Uber One-style) program. Same operations the web uses.

const MEMBERSHIP_FIELDS = `
  _id
  status
  source
  isActive
  currentPeriodEnd
  cancelAtPeriodEnd
  planSnapshot { name price interval intervalCount }
  benefits { freeDelivery orderDiscountPercent maxOrderDiscount }
`

export const MEMBERSHIP_PROGRAM = gql`
  query MembershipProgram {
    membershipProgram {
      enabled
      name
      tagline
      perks
      freeDeliveryMinOrder
      trialDays
      plans {
        _id
        name
        price
        interval
        intervalCount
        badge
        freeDelivery
        orderDiscountPercent
        maxOrderDiscount
      }
    }
  }
`

export const MY_MEMBERSHIP = gql`
  query MyMembership {
    myMembership {
      totalSaved
      ordersWithSavings
      trialAvailable
      membership { ${MEMBERSHIP_FIELDS} }
    }
  }
`

export const START_MEMBERSHIP_CHECKOUT = gql`
  mutation StartMembershipCheckout($planId: ID!) {
    startMembershipCheckout(planId: $planId)
  }
`

export const CONFIRM_MEMBERSHIP_CHECKOUT = gql`
  mutation ConfirmMembershipCheckout($sessionId: String!) {
    confirmMembershipCheckout(sessionId: $sessionId) { ${MEMBERSHIP_FIELDS} }
  }
`

export const CANCEL_MEMBERSHIP = gql`
  mutation CancelMembership {
    cancelMembership { ${MEMBERSHIP_FIELDS} }
  }
`

export const RESUME_MEMBERSHIP = gql`
  mutation ResumeMembership {
    resumeMembership { ${MEMBERSHIP_FIELDS} }
  }
`
