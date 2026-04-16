import LoyaltyAndReferralHeader from '@/lib/ui/screen-components/protected/super-admin/loyalty-referrals/header';
import LoyaltyAndReferralTierSystemComponent from '@/lib/ui/screen-components/protected/super-admin/loyalty-referrals/customer-tier-system';
import LoyaltyAndReferralHistoryComponent from '@/lib/ui/screen-components/protected/super-admin/loyalty-referrals/loyalty-and-referral-history';
import LoyaltyAndReferralBreakdownSectionComponent from '@/lib/ui/screen-components/protected/super-admin/loyalty-referrals/loyalty-points-breakdown';
import LoyaltyAndReferralStatsCardComponent from '@/lib/ui/screen-components/protected/super-admin/loyalty-referrals/stats-cards.component';
import UplineOrderReferralRewardsComponent from '@/lib/ui/screen-components/protected/super-admin/loyalty-referrals/upline-order-referral-rewards';

export default function LoyaltyAndReferralScreen() {
  return (
    <div className="screen-container">
      <LoyaltyAndReferralHeader />
      <LoyaltyAndReferralStatsCardComponent />
      <UplineOrderReferralRewardsComponent />
      <LoyaltyAndReferralTierSystemComponent />
      <LoyaltyAndReferralBreakdownSectionComponent />
      <LoyaltyAndReferralHistoryComponent />
    </div>
  );
}
