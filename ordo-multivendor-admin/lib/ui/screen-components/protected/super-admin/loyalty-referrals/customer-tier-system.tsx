'use client';

import {
  faAdd,
  faEdit,
  faEllipsisVertical,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import TierForm from './forms/tier.form';
import { useLoyaltyContext } from '@/lib/hooks/useLoyalty';
import useToast from '@/lib/hooks/useToast';
import {
  FetchLoyaltyTiersByUserTypeDocument,
  useDeleteLoyaltyTierMutation,
  useFetchLoyaltyTiersByUserTypeQuery,
} from '@/lib/graphql-generated';
import DashboardStatsCardSkeleton from '@/lib/ui/useable-components/custom-skeletons/dasboard.stats.card.skeleton';
import NoData from '@/lib/ui/useable-components/no-data';
import { ProgressSpinner } from 'primereact/progressspinner';
import { toTextCase } from '@/lib/utils/methods';

interface LevelCardProps {
  name: string;
  point: number;
  requiredDirectDownlines?: number | null;
  weeklyOrderQuota?: number | null;
  loading?: boolean;
  onMenuClick: () => void;
}

function LevelCard({ name, point, requiredDirectDownlines, weeklyOrderQuota, loading, onMenuClick, isRider }: LevelCardProps & { isRider: boolean }) {
  return (
    <div className="bg-[#F9FAFB] dark:bg-dark-900 border border-[#E4E4E7] dark:border-dark-600 rounded-2xl p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="inline-block bg-[#FFF2E6] dark:bg-dark-600 border border-[#FF8000] dark:border-primary-dark px-3 py-1 rounded-full text-sm font-medium text-foreground dark:text-white">
          {name}
        </span>
        {loading ? (
          <ProgressSpinner
            className="m-0 h-6 w-6 items-center self-center p-0"
            strokeWidth="5"
            style={{ fill: 'white', accentColor: 'white' }}
            color="white"
          />
        ) : (
          <button
            onClick={onMenuClick}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
        )}
      </div>

      {!isRider && (
        <div className="text-4xl text-foreground dark:text-white font-inter font-semibold text-[30px] leading-[36px] tracking-normal">
          {point ?? 0} pts
        </div>
      )}
      {(requiredDirectDownlines != null && requiredDirectDownlines > 0) && (
        <p className="text-xs text-muted-foreground mt-2">
          <span className="font-semibold text-foreground dark:text-white">{requiredDirectDownlines}</span> direct downlines to reach this level
        </p>
      )}
      {(weeklyOrderQuota != null && weeklyOrderQuota > 0) && (
        <p className="text-xs text-muted-foreground mt-1">
          <span className="font-semibold text-foreground dark:text-white">{weeklyOrderQuota}</span> {isRider ? 'deliveries/week' : 'orders/week'} to unlock residual income
        </p>
      )}
    </div>
  );
}

export default function LoyaltyAndReferralTierSystemComponent() {
  // Hooks
  const { tierFormVisible, setTierFormVisible, setLoyaltyData, loyaltyType } =
    useLoyaltyContext();
  const { showToast } = useToast();

  // States
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const isRider = loyaltyType === 'Rider Loyalty Program';
  const userType = isRider ? 'driver' : 'customer';

  // API
  const { data, loading } = useFetchLoyaltyTiersByUserTypeQuery({ variables: { userType } });
  const [deleteLoyaltyTier, { loading: deletingTier }] =
    useDeleteLoyaltyTierMutation();

  const tiers = data?.fetchLoyaltyTiersByUserType ?? [];

  // Handlers
  const handleDeleteTier = async (id: string) => {
    try {
      setDeletingId(id);
      setOpenMenu(null);
      await deleteLoyaltyTier({
        variables: { id },
        refetchQueries: [{ query: FetchLoyaltyTiersByUserTypeDocument, variables: { userType } }],
      });

      showToast({
        type: 'success',
        title: 'Delete Tier',
        message: 'Tier has been deleted successfully.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed.',
        message: (err as Error)?.message || 'Please try again later',
      });
    } finally {
      setDeletingId('');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="m-3 p-6 pb-2 bg-background border border-border rounded-2xl">
        <div className="">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="md:text-2xl text-foreground mb-2 font-inter font-semibold text-2xl leading-8 tracking-normal">
                {isRider ? 'Rider' : 'Customer'} Success Levels
              </h1>
              <p className="text-[#4F4F4F] font-inter font-normal text-lg leading-7 tracking-normal">
                {isRider
                  ? 'Set success levels for riders — required downlines and weekly delivery quota to unlock residual income.'
                  : 'Set tier thresholds for customers against their earned points.'}
              </p>
            </div>
            <button
              className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setTierFormVisible(true)}
            >
              <FontAwesomeIcon icon={faAdd} /> Create Tier
            </button>
          </div>

          {/* Levels Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            ref={menuRef}
          >
            {loading ? (
              <>
                {new Array(3).fill(0).map((_, index) => (
                  <DashboardStatsCardSkeleton key={index} />
                ))}
              </>
            ) : tiers.length === 0 ? (
              <NoData />
            ) : (
              tiers.map((tier) => {
                if (!tier) return;

                return (
                  <div key={tier._id} className="relative">
                    <LevelCard
                      name={toTextCase(tier.name || '', 'title')}
                      point={tier.points}
                      requiredDirectDownlines={tier.requiredDirectDownlines}
                      weeklyOrderQuota={tier.weeklyOrderQuota}
                      isRider={isRider}
                      loading={deletingTier && tier?._id === deletingId}
                      onMenuClick={() =>
                        setOpenMenu(openMenu === tier._id ? null : tier._id)
                      }
                    />

                    {openMenu === tier._id && (
                      <div className="absolute top-14 right-2 bg-background dark:bg-dark-900 border border-border dark:border-dark-600 rounded-lg shadow-lg z-10 w-40">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-600 flex items-center gap-2 text-sm text-foreground dark:text-white"
                          onClick={() => {
                            setOpenMenu(null);
                            setLoyaltyData({ tierId: tier?._id });
                            setTierFormVisible(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier._id)}
                          className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-600 flex items-center gap-2 text-sm text-destructive"
                        >
                          <FontAwesomeIcon icon={faTrash} color="#EF4444" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {tierFormVisible && <TierForm />}
    </>
  );
}
