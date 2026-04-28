'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faUser,
  faTimes,
  faChevronRight,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import {
  useFetchUserReferralNetworkStatsQuery,
  useFetchDriverReferralNetworkStatsQuery,
  useSearchReferralUsersLazyQuery,
  useSearchReferralDriversLazyQuery,
  useFetchUserReferralNetworkDetailLazyQuery,
  useFetchDriverReferralNetworkDetailLazyQuery,
  type ReferralNetworkUser,
  type ReferralNetworkDriver,
  type UserReferralNetworkDetail,
  type ReferralNetworkStats,
} from '@/lib/graphql-generated';
import useDebounce from '@/lib/hooks/useDebounce';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { Skeleton } from 'primereact/skeleton';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  Bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  Silver: 'bg-gray-100 text-gray-700 border-gray-300',
  Gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Platinum: 'bg-purple-100 text-purple-800 border-purple-300',
};

const LEVEL_CONFIG = [
  { key: 'level1' as const, label: 'Level 1', color: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' },
  { key: 'level2' as const, label: 'Level 2', color: 'border-l-green-500 bg-green-50 dark:bg-green-950/20' },
  { key: 'level3' as const, label: 'Level 3', color: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' },
];

// ── SummaryBar ────────────────────────────────────────────────────────────────

function SummaryBarSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {new Array(4).fill(0).map((_, i) => (
        <div key={i} className="bg-[#F9FAFB] dark:bg-dark-900 border border-[#E4E4E7] dark:border-dark-600 rounded-xl p-4 space-y-2">
          <Skeleton width="70%" height="0.875rem" />
          <Skeleton width="40%" height="1.75rem" />
        </div>
      ))}
    </div>
  );
}

function SummaryBar({ stats, loading, isDriver }: { stats?: ReferralNetworkStats | null; loading: boolean; isDriver: boolean }) {
  if (loading) return <SummaryBarSkeleton />;

  const items = [
    { label: isDriver ? 'Total Riders' : 'Total Users', value: stats?.totalCount ?? 0, color: 'text-foreground' },
    { label: 'Level 1 Downlines', value: stats?.level1Count ?? 0, color: 'text-blue-600' },
    { label: 'Level 2 Downlines', value: stats?.level2Count ?? 0, color: 'text-green-600' },
    { label: 'Level 3 Downlines', value: stats?.level3Count ?? 0, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className="bg-[#F9FAFB] dark:bg-dark-900 border border-[#E4E4E7] dark:border-dark-600 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
          <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── ReferralLevelPanel ────────────────────────────────────────────────────────

function MemberCard({ member, isDriver, currencySymbol }: {
  member: { _id: string; name: string; email?: string | null; phone?: string | null; createdAt?: string | null; activityCount: number; points: number; releasedRewards?: number | null; pendingRewards?: number | null; expiredRewards?: number | null };
  isDriver: boolean;
  currencySymbol: string;
}) {
  const initials = member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const joinedDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const unit = isDriver ? currencySymbol : 'pts';
  const released = member.releasedRewards ?? 0;
  const pending = member.pendingRewards ?? 0;
  const expired = member.expiredRewards ?? 0;
  const hasResidual = released > 0 || pending > 0 || expired > 0;

  return (
    <div className="bg-white dark:bg-dark-900 border border-border rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#FFF2E6] dark:bg-dark-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#FF8000]">
          {initials || <FontAwesomeIcon icon={isDriver ? faTruck : faUser} className="text-[#FF8000] text-xs" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground dark:text-white truncate">{member.name}</p>
          {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
          {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
          {joinedDate && <p className="text-xs text-muted-foreground mt-0.5">Joined {joinedDate}</p>}
        </div>
      </div>

      {hasResidual ? (
        <div className="border-t border-border pt-2 grid grid-cols-3 gap-1 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-green-600 font-semibold">{released} {unit}</span>
            <span className="text-muted-foreground">Released</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-amber-500 font-semibold">{pending} {unit}</span>
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-400 font-semibold">{expired} {unit}</span>
            <span className="text-muted-foreground">Expired</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground border-t border-border pt-2">No order rewards yet</p>
      )}
    </div>
  );
}

function ReferralLevelPanel({ detail, isDriver, currencySymbol }: { detail: UserReferralNetworkDetail; isDriver: boolean; currencySymbol: string }) {

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-[#FFF2E6] dark:bg-dark-600 flex items-center justify-center">
          <FontAwesomeIcon icon={isDriver ? faTruck : faUser} className="text-[#FF8000]" />
        </div>
        <div>
          <p className="font-semibold text-foreground dark:text-white">{detail.name}</p>
          <p className="text-sm text-muted-foreground">{detail.email}</p>
        </div>
        {detail.tier && (
          <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full border ${TIER_COLORS[detail.tier] ?? ''}`}>
            {detail.tier}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {isDriver ? 'Direct Earnings:' : 'Direct Points:'}{' '}
        <span className="font-semibold text-foreground dark:text-white">
          {isDriver
            ? `${currencySymbol}${detail.directPoints.toLocaleString()}`
            : `${detail.directPoints.toLocaleString()} pts`}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        {isDriver ? 'Residual Earnings:' : 'Residual Points:'}{' '}
        <span className="font-semibold text-amber-600 dark:text-amber-400">
          {isDriver
            ? `${currencySymbol}${detail.residualPoints.toLocaleString()}`
            : `${detail.residualPoints.toLocaleString()} pts`}
        </span>
      </p>

      {LEVEL_CONFIG.map(({ key, label, color }) => {
        const level = detail[key];
        return (
          <div key={key} className={`border-l-4 rounded-r-xl p-4 ${color}`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-semibold text-foreground dark:text-white text-sm">{label} Downlines</span>

              </div>
              <span className="text-xs font-medium bg-white dark:bg-dark-900 border border-border rounded-full px-2 py-0.5">
                {level.memberCount} {isDriver ? 'riders' : 'users'}
              </span>
            </div>

            {level.members.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No invitations at this level</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {level.members.map((member) => (
                  <MemberCard key={member._id} member={member} isDriver={isDriver} currencySymbol={currencySymbol} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-[#F9FAFB] dark:bg-dark-900">
      <Skeleton shape="circle" size="2rem" className="flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton width="60%" height="0.875rem" />
        <Skeleton width="80%" height="0.75rem" />
      </div>
    </div>
  );
}

function DetailPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* User header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Skeleton shape="circle" size="2.5rem" />
        <div className="flex-1 space-y-1.5">
          <Skeleton width="45%" height="1rem" />
          <Skeleton width="60%" height="0.75rem" />
        </div>
        <Skeleton width="3.5rem" height="1.5rem" borderRadius="9999px" />
      </div>
      {/* Points line */}
      <Skeleton width="35%" height="0.875rem" />
      {/* Level blocks */}
      {new Array(3).fill(0).map((_, i) => (
        <div key={i} className="border-l-4 border-l-gray-200 dark:border-l-dark-600 rounded-r-xl p-4 bg-gray-50 dark:bg-dark-900 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton width="40%" height="0.875rem" />
            <Skeleton width="4rem" height="1.25rem" borderRadius="9999px" />
          </div>
          <Skeleton width="100%" height="2.25rem" borderRadius="0.5rem" />
          <Skeleton width="100%" height="2.25rem" borderRadius="0.5rem" />
        </div>
      ))}
    </div>
  );
}

// ── NetworkPanel ──────────────────────────────────────────────────────────────

type ListItem = ReferralNetworkUser | ReferralNetworkDriver;

const PAGE_LIMIT = 20;

function NetworkPanel({ isDriver, stats, statsLoading }: { isDriver: boolean; stats?: ReferralNetworkStats | null; statsLoading: boolean }) {
  const { CURRENCY_SYMBOL } = useConfiguration();
  const currencySymbol = CURRENCY_SYMBOL || '$';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [list, setList] = useState<ListItem[]>([]);
  const [detail, setDetail] = useState<UserReferralNetworkDetail | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 400);

  const [searchUsers, { loading: searchingUsers }] = useSearchReferralUsersLazyQuery();
  const [searchDrivers, { loading: searchingDrivers }] = useSearchReferralDriversLazyQuery();

  const [fetchUserDetail, { loading: loadingUserDetail }] = useFetchUserReferralNetworkDetailLazyQuery({
    onCompleted: (data) => setDetail(data.fetchUserReferralNetworkDetail ?? null),
  });

  const [fetchDriverDetail, { loading: loadingDriverDetail }] = useFetchDriverReferralNetworkDetailLazyQuery({
    onCompleted: (data) => setDetail(data.fetchDriverReferralNetworkDetail ?? null),
  });

  const fetchPage = useCallback(async (searchVal: string, pageNum: number, append: boolean) => {
    const filter = { search: searchVal, page: pageNum, limit: PAGE_LIMIT };

    let raw: ListItem[] = [];
    let total = 0;

    if (isDriver) {
      const result = await searchDrivers({ variables: { filter } });
      raw = (result.data?.searchReferralDrivers?.data ?? []) as ListItem[];
      total = result.data?.searchReferralDrivers?.totalCount ?? 0;
    } else {
      const result = await searchUsers({ variables: { filter } });
      raw = (result.data?.searchReferralUsers?.data ?? []) as ListItem[];
      total = result.data?.searchReferralUsers?.totalCount ?? 0;
    }

    setList((prev) => append ? [...prev, ...raw] : raw);
    setHasMore(pageNum * PAGE_LIMIT < total);
    setIsFetchingMore(false);
  }, [isDriver, searchUsers, searchDrivers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset + fetch page 1 whenever search or tab changes
  useEffect(() => {
    setPage(1);
    setList([]);
    setHasMore(true);
    fetchPage(debouncedSearch, 1, false);
  }, [debouncedSearch, isDriver]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40 && hasMore && !isFetchingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        setIsFetchingMore(true);
        fetchPage(debouncedSearch, nextPage, true);
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, isFetchingMore, page, debouncedSearch, fetchPage]);

  const handleSelect = useCallback((item: ListItem) => {
    setSelectedId(item._id);
    setDetail(null);
    if (isDriver) fetchDriverDetail({ variables: { driverId: item._id } });
    else fetchUserDetail({ variables: { userId: item._id } });
  }, [isDriver, fetchUserDetail, fetchDriverDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSearching = (isDriver ? searchingDrivers : searchingUsers) && page === 1 && list.length === 0;
  const isLoadingDetail = isDriver ? loadingDriverDetail : loadingUserDetail;

  return (
    <>
      <SummaryBar stats={stats} loading={statsLoading} isDriver={isDriver} />

      <div className="flex flex-col md:flex-row gap-6">
        {/* List */}
        <div className="md:w-80 flex-shrink-0">
          <div className="relative mb-3">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
            <input
              type="text"
              placeholder={isDriver ? 'Search riders...' : 'Search users...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF8000]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            )}
          </div>

          <div ref={scrollRef} className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {isSearching ? (
              <div className="space-y-2">
                {new Array(5).fill(0).map((_, i) => <ListItemSkeleton key={i} />)}
              </div>
            ) : list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No {isDriver ? 'riders' : 'users'} found
              </p>
            ) : (
              <>
                {list.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      selectedId === item._id
                        ? 'border-[#FF8000] bg-[#FFF2E6] dark:bg-dark-600'
                        : 'border-border bg-[#F9FAFB] dark:bg-dark-900 hover:border-[#FF8000]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#FFF2E6] dark:bg-dark-600 flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={isDriver ? faTruck : faUser} className="text-[#FF8000] text-xs" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {item.tier && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${TIER_COLORS[item.tier] ?? ''}`}>
                          {item.tier}
                        </span>
                      )}
                      <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground text-xs" />
                    </div>
                  </button>
                ))}
                {isFetchingMore && (
                  <div className="space-y-2 pt-1">
                    {new Array(3).fill(0).map((_, i) => <ListItemSkeleton key={`more-${i}`} />)}
                  </div>
                )}
                {!hasMore && list.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">All results loaded</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 border border-border rounded-xl p-5 min-h-[300px]">
          {isLoadingDetail ? (
            <DetailPanelSkeleton />
          ) : detail ? (
            <ReferralLevelPanel detail={detail} isDriver={isDriver} currencySymbol={currencySymbol} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground">
              <FontAwesomeIcon icon={isDriver ? faTruck : faUser} className="text-4xl mb-3 opacity-20" />
              <p className="text-sm">Select a {isDriver ? 'rider' : 'user'} to view their invitation network</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

type Tab = 'user' | 'driver';

export default function ReferralNetworkComponent() {
  const [activeTab, setActiveTab] = useState<Tab>('user');

  const { data: userStatsData, loading: userStatsLoading } = useFetchUserReferralNetworkStatsQuery({ fetchPolicy: 'cache-and-network' });
  const { data: driverStatsData, loading: driverStatsLoading } = useFetchDriverReferralNetworkStatsQuery({ fetchPolicy: 'cache-and-network' });

  return (
    <div className="m-3 p-6 bg-background border border-border rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-inter font-semibold text-2xl leading-8 text-foreground dark:text-white mb-1">
            My Foodie Network
          </h1>
          <p className="text-[#4F4F4F] font-inter font-normal text-lg leading-7">
            Search to view referral levels and earned rewards.
          </p>
        </div>

        <div className="flex bg-[#F4F4F5] dark:bg-dark-600 rounded-lg p-1 gap-1 self-start sm:self-auto">
          {(['user', 'driver'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-dark-900 text-foreground dark:text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={tab === 'driver' ? faTruck : faUser} className="text-xs" />
              {tab === 'user' ? 'Customer Foodie Network' : 'Rider Delivery Network'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'user' ? (
        <NetworkPanel isDriver={false} stats={userStatsData?.fetchUserReferralNetworkStats} statsLoading={userStatsLoading} />
      ) : (
        <NetworkPanel isDriver={true} stats={driverStatsData?.fetchDriverReferralNetworkStats} statsLoading={driverStatsLoading} />
      )}
    </div>
  );
}
