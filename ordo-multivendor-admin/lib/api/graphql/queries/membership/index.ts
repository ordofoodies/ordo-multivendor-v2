import { gql } from '@apollo/client';

const SETTINGS_FIELDS = `
  enabled
  name
  tagline
  perks
  freeDeliveryMinOrder
  trialDays
`;

const PLAN_FIELDS = `
  _id
  name
  price
  interval
  intervalCount
  badge
  isActive
  sortOrder
  freeDelivery
  orderDiscountPercent
  maxOrderDiscount
`;

const MEMBERSHIP_FIELDS = `
  _id
  user { _id name email }
  planSnapshot { name price interval intervalCount }
  status
  source
  isActive
  currentPeriodEnd
  cancelAtPeriodEnd
  note
  createdAt
  benefits { freeDelivery orderDiscountPercent maxOrderDiscount }
`;

export const GET_MEMBERSHIP_SETTINGS = gql`
  query MembershipSettings {
    membershipSettings { ${SETTINGS_FIELDS} }
  }
`;

export const GET_MEMBERSHIP_PLANS = gql`
  query MembershipPlans {
    membershipPlans { ${PLAN_FIELDS} }
  }
`;

export const GET_MEMBERSHIPS = gql`
  query Memberships($status: String) {
    memberships(status: $status) { ${MEMBERSHIP_FIELDS} }
  }
`;

export const GET_MEMBERSHIP_REPORT = gql`
  query MembershipReport($from: String, $to: String) {
    membershipReport(from: $from, to: $to) {
      activeMembers
      trialingMembers
      pastDueMembers
      grantedMembers
      revenue
      payments
      deliverySavings
      freeDeliveryOrders
      orderDiscounts
      memberOrders
      net
    }
  }
`;

export const UPDATE_MEMBERSHIP_SETTINGS = gql`
  mutation UpdateMembershipSettings($input: MembershipSettingsInput!) {
    updateMembershipSettings(input: $input) { ${SETTINGS_FIELDS} }
  }
`;

export const CREATE_MEMBERSHIP_PLAN = gql`
  mutation CreateMembershipPlan($input: MembershipPlanInput!) {
    createMembershipPlan(input: $input) { ${PLAN_FIELDS} }
  }
`;

export const UPDATE_MEMBERSHIP_PLAN = gql`
  mutation UpdateMembershipPlan($id: ID!, $input: MembershipPlanInput!) {
    updateMembershipPlan(id: $id, input: $input) { ${PLAN_FIELDS} }
  }
`;

export const GRANT_MEMBERSHIP = gql`
  mutation GrantMembership($email: String!, $days: Int!, $planId: ID, $note: String) {
    grantMembership(email: $email, days: $days, planId: $planId, note: $note) { ${MEMBERSHIP_FIELDS} }
  }
`;

export const REVOKE_MEMBERSHIP = gql`
  mutation RevokeMembership($id: ID!) {
    revokeMembership(id: $id) { ${MEMBERSHIP_FIELDS} }
  }
`;
