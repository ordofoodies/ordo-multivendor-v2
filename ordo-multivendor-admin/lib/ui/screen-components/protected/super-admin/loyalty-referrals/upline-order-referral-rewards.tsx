'use client';

import { faAdd, faEdit, faEllipsisVertical, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

import { useLoyaltyContext } from '@/lib/hooks/useLoyalty';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { toTextCase } from '@/lib/utils/methods';
import useToast from '@/lib/hooks/useToast';
import DashboardStatsCardSkeleton from '@/lib/ui/useable-components/custom-skeletons/dasboard.stats.card.skeleton';
import NoData from '@/lib/ui/useable-components/no-data';
import OrderLevelForm from './forms/order-level.form';
import {
  FetchOrderLoyaltyLevelsByUserTypeDocument,
  useDeleteOrderLoyaltyLevelMutation,
  useFetchOrderLoyaltyLevelsByUserTypeQuery,
} from '@/lib/graphql-generated';

export default function UplineOrderReferralRewardsComponent() {
  const { loyaltyType, orderLevelFormVisible, setOrderLevelFormVisible, setLoyaltyData } =
    useLoyaltyContext();
  const { CURRENCY_SYMBOL } = useConfiguration();
  const { showToast } = useToast();

  const isCustomer = loyaltyType === 'Customer Loyalty Program';
  const userType = isCustomer ? 'customer' : 'driver';

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useFetchOrderLoyaltyLevelsByUserTypeQuery({ variables: { userType } });
  const [deleteLevel, { loading: deleting }] = useDeleteOrderLoyaltyLevelMutation();

  const levels = data?.fetchOrderLoyaltyLevelsByUserType ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setOpenMenu(null);
      await deleteLevel({
        variables: { id },
        refetchQueries: [{ query: FetchOrderLoyaltyLevelsByUserTypeDocument, variables: { userType } }],
      });
      showToast({ type: 'success', title: 'Delete Level', message: 'Level deleted successfully.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Failed.', message: (err as Error)?.message || 'Please try again later' });
    } finally {
      setDeletingId('');
    }
  };

  return (
    <>
      <div className="m-3 p-6 pb-2 bg-background border border-border rounded-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="md:text-2xl text-foreground mb-2 font-inter font-semibold text-2xl leading-8 tracking-normal">
              {isCustomer ? 'Customer' : 'Driver'} Upline Order Rewards
            </h1>
            <p className="text-[#4F4F4F] font-inter font-normal text-lg leading-7 tracking-normal">
              {isCustomer
                ? 'Points an upline earns per order placed by their downline.'
                : `Cash an upline earns per delivery completed by their downline.`}
            </p>
          </div>
          <button
            className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
            onClick={() => setOrderLevelFormVisible(true)}
          >
            <FontAwesomeIcon icon={faAdd} /> Create Level
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" ref={menuRef}>
          {loading ? (
            new Array(3).fill(0).map((_, i) => <DashboardStatsCardSkeleton key={i} />)
          ) : !levels || levels.length === 0 ? (
            <NoData />
          ) : (
            levels.map((level) => {
              if (!level) return null;
              const value = isCustomer ? level.points : level.amount;
              return (
                <div key={level._id} className="relative">
                  <div className="bg-[#F9FAFB] dark:bg-dark-900 border border-[#E4E4E7] dark:border-dark-600 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-block bg-[#FFF2E6] dark:bg-dark-600 border border-[#FF8000] dark:border-primary-dark px-3 py-1 rounded-full text-sm font-medium text-foreground dark:text-white">
                        {toTextCase(level.name || '', 'title')}
                      </span>
                      {deleting && level._id === deletingId ? (
                        <ProgressSpinner
                          className="m-0 h-6 w-6 items-center self-center p-0"
                          strokeWidth="5"
                          style={{ fill: 'white', accentColor: 'white' }}
                          color="white"
                        />
                      ) : (
                        <button
                          onClick={() => setOpenMenu(openMenu === level._id ? null : level._id)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                      )}
                    </div>
                    <div className="text-foreground dark:text-white font-inter font-semibold text-[30px] leading-[36px]">
                      {value ?? 0} {isCustomer ? 'pts' : CURRENCY_SYMBOL}
                      <span className="text-sm font-normal text-muted-foreground ml-1">/ order</span>
                    </div>
                  </div>

                  {openMenu === level._id && (
                    <div className="absolute top-14 right-2 bg-background dark:bg-dark-900 border border-border dark:border-dark-600 rounded-lg shadow-lg z-10 w-40">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-600 flex items-center gap-2 text-sm text-foreground dark:text-white"
                        onClick={() => {
                          setOpenMenu(null);
                          setLoyaltyData({ orderLevelId: level._id });
                          setOrderLevelFormVisible(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(level._id)}
                        disabled={deleting}
                        className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-600 flex items-center gap-2 text-sm text-destructive"
                      >
                        <FontAwesomeIcon icon={faTrash} color="#EF4444" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {orderLevelFormVisible && <OrderLevelForm />}
    </>
  );
}
