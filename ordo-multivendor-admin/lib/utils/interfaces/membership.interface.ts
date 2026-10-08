export type TMembershipInterval = 'day' | 'week' | 'month' | 'year';
export type TMembershipStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface IMembershipSettings {
  enabled: boolean;
  name: string;
  tagline?: string | null;
  perks?: string[] | null;
  freeDeliveryMinOrder: number;
  trialDays: number;
}

export interface IMembershipPlan {
  _id: string;
  name: string;
  price: number;
  interval: TMembershipInterval;
  intervalCount: number;
  badge?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
  freeDelivery: boolean;
  orderDiscountPercent: number;
  maxOrderDiscount: number;
}

export type IMembershipBenefits = Pick<IMembershipPlan, 'freeDelivery' | 'orderDiscountPercent' | 'maxOrderDiscount'>;

export interface IMembershipRecord {
  _id: string;
  user?: { _id: string; name?: string | null; email?: string | null } | null;
  planSnapshot?: Partial<Pick<IMembershipPlan, 'name' | 'price' | 'interval' | 'intervalCount'>> | null;
  status: TMembershipStatus;
  source: 'stripe' | 'admin';
  isActive: boolean;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean | null;
  note?: string | null;
  createdAt?: string | null;
  benefits: IMembershipBenefits;
}

export interface IMembershipReport {
  activeMembers: number;
  trialingMembers: number;
  pastDueMembers: number;
  grantedMembers: number;
  revenue: number;
  payments: number;
  deliverySavings: number;
  freeDeliveryOrders: number;
  orderDiscounts: number;
  memberOrders: number;
  net: number;
}
