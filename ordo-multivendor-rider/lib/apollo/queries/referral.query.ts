import { gql } from "@apollo/client";

export const FETCH_RIDER_RECENT_ACTIVITY = gql`
  query FetchRiderRecentActivity(
    $startDate: String
    $endDate: String
    $limit: Int
    $offset: Int
  ) {
    fetchRiderRecentActivity(
      filter: {
        startDate: $startDate
        endDate: $endDate
        limit: $limit
        offset: $offset
      }
    ) {
      activities {
        _id
        user_name
        user_rank
        type
        source
        level
        value
        triggeredBy
        createdAt
      }
      summary {
        totalEarnings
        totalReferrals
        periodStart
        periodEnd
      }
      hasMore
      total
    }
  }
`;

export const FETCH_RIDER_ACTIVITY_DETAILS = gql`
  query FetchRiderActivityDetails($activityId: String!) {
    fetchRiderActivityDetails(activityId: $activityId) {
      _id
      totalEarnings
      totalReferrals
      createdAt
      referralsByLevel {
        level1 {
          count
          earnings
          riders {
            _id
            name
            phone
            joinedAt
            earnedAmount
          }
        }
        level2 {
          count
          earnings
          riders {
            _id
            name
            phone
            joinedAt
            earnedAmount
          }
        }
        level3 {
          count
          earnings
          riders {
            _id
            name
            phone
            joinedAt
            earnedAmount
          }
        }
      }
    }
  }
`;

export const FETCH_RIDER_ACTIVITIES_BY_DATE = gql`
  query FetchRiderActivitiesByDate(
    $startDate: String!
    $endDate: String!
  ) {
    fetchRiderRecentActivity(
      filter: {
        startDate: $startDate
        endDate: $endDate
        limit: 100
        offset: 0
      }
    ) {
      activities {
        _id
        user_name
        user_rank
        type
        source
        level
        value
        triggeredBy
        createdAt
      }
      summary {
        totalEarnings
        totalReferrals
        periodStart
        periodEnd
      }
      hasMore
      total
    }
  }
`;

export const FETCH_RIDER_REFERRAL_REWARDS = gql`
  query FetchRiderReferralRewards($level: Int) {
    fetchRiderReferralRewards(level: $level) {
      totalEarnings
      currentBalance
      totalWithdrawn
      earningsByLevel {
        level1 {
          totalEarnings
          totalReferrals
        }
        level2 {
          totalEarnings
          totalReferrals
        }
        level3 {
          totalEarnings
          totalReferrals
        }
      }
      referralDetails {
        riderId
        riderName
        riderPhone
        joinedAt
        level
        earnedAmount
        status
      }
    }
  }
`;

export const FETCH_RIDER_LOYALTY_HISTORY = gql`
  query FetchRiderLoyaltyHistory {
    fetchRiderLoyaltyHistory {
      _id
      type
      source
      level
      rewardRole
      value
      triggeredBy
      createdAt
    }
  }
`;

export const FETCH_RIDER_LOYALTY_DATA = gql`
  query FetchRiderLoyaltyData {
    fetchRiderLoyaltyData {
      totalEarnedCash
      cashBalance
      loyaltyCash
      referralCash
    }
  }
`;

export const FETCH_RIDER_RESIDUAL_LOYALTY_DATA = gql`
  query FetchRiderResidualLoyaltyData {
    fetchRiderResidualLoyaltyData {
      residualCashBalance
      totalResidualCashEarned
      tierName
      weeklyOrderQuota
      requiredCompletedOrders
    }
  }
`;

export const FETCH_RIDER_RESIDUAL_TRANSACTIONS = gql`
  query FetchRiderResidualTransactions {
    fetchRiderResidualTransactions {
      _id
      value
      level
      residualStatus
      completionWindow
      requiredCompletedOrders
      eligibleFrom
      eligibleUntil
      triggeredBy
      createdAt
    }
  }
`;

export const FETCH_DRIVER_REFERRAL_LEVEL_COUNTS = gql`
  query FetchDriverReferralLevelCounts {
    fetchDriverReferralLevelCounts {
      level1Count
      level2Count
      level3Count
    }
  }
`;
