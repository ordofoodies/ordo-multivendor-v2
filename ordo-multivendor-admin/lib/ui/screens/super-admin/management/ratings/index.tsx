'use client';

// Core
import { useMemo, useState } from 'react';

// Apollo
import { useQuery } from '@apollo/client';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

// PrimeReact
import { Skeleton } from 'primereact/skeleton';

// Localization
import { useTranslations } from 'next-intl';

// GraphQL
import {
  GET_ADMIN_REVIEWS,
  GET_RATINGS_LEADERBOARD,
  GET_RATINGS_SUMMARY,
} from '@/lib/api/graphql';

// Components
import HeaderText from '@/lib/ui/useable-components/header-text';
import Table from '@/lib/ui/useable-components/table';
import ReviewTags from '@/lib/ui/useable-components/review-tags';
import {
  NEGATIVE_REVIEW_TAGS,
  reviewTagLabel,
} from '@/lib/utils/constants/review-tags';

// Interfaces
import {
  IAdminReview,
  IAdminReviewsPage,
  IRatedEntity,
  IRatingStat,
  IRatingsSummary,
  TRatingCategory,
} from '@/lib/utils/interfaces';

type TReviewFilter = 'ALL' | 'COMMENTS' | 'LOW';

const CATEGORIES: { key: TRatingCategory; label: string; statKey: keyof Omit<IRatingsSummary, 'totalReviews' | 'withComments' | 'topTags'> }[] = [
  { key: 'RESTAURANT', label: 'ratings_restaurant', statKey: 'restaurant' },
  { key: 'FOOD', label: 'ratings_food', statKey: 'food' },
  { key: 'RIDER', label: 'ratings_rider', statKey: 'rider' },
  { key: 'SERVICE', label: 'ratings_ordo_service', statKey: 'service' },
];

const LOW_RATING_MAX_STARS = 2;

const Stars = ({ value }: { value: number | null | undefined }) => {
  if (!value) return <span className="text-gray-400">-</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
      <span className={value <= LOW_RATING_MAX_STARS ? 'font-semibold text-red-600' : ''}>
        {value}
      </span>
    </span>
  );
};

const StatCard = ({ title, stat }: { title: string; stat?: IRatingStat }) => {
  const t = useTranslations();
  const max = Math.max(...(stat?.distribution ?? [0]), 1);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold">
          {stat && stat.count ? stat.average.toFixed(2) : '-'}
        </span>
        <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
        <span className="text-xs text-gray-500">
          {t('ratings_count', { count: stat?.count ?? 0 })}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = stat?.distribution?.[stars - 1] ?? 0;
          return (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-gray-500">{stars}</span>
              <div className="h-2 flex-1 rounded bg-gray-100">
                <div
                  className="h-2 rounded bg-yellow-400"
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-500">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Leaderboard = ({
  title,
  rows,
  loading,
}: {
  title: string;
  rows?: IRatedEntity[];
  loading: boolean;
}) => {
  const t = useTranslations();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 font-medium">{title}</p>
      {loading && !rows ? (
        <Skeleton height="10rem" />
      ) : !rows?.length ? (
        <p className="text-sm text-gray-500">{t('ratings_no_data')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row._id} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate pr-2">{row.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <Stars value={Number(row.average.toFixed(1))} />
                <span className="w-20 text-right text-xs text-gray-500">
                  {t('ratings_count', { count: row.count })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function RatingsSummaryScreen() {
  const t = useTranslations();

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reviewFilter, setReviewFilter] = useState<TReviewFilter>('ALL');
  const [lowCategory, setLowCategory] = useState<TRatingCategory>('RESTAURANT');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const dates = useMemo(
    () => ({ dateFrom: dateFrom || null, dateTo: dateTo || null }),
    [dateFrom, dateTo]
  );

  // Queries
  const { data: summaryData, loading: summaryLoading } = useQuery<{
    ratingsSummary: IRatingsSummary;
  }>(GET_RATINGS_SUMMARY, { variables: dates, fetchPolicy: 'cache-and-network' });

  const { data: storesData, loading: storesLoading } = useQuery<{
    ratingsLeaderboard: IRatedEntity[];
  }>(GET_RATINGS_LEADERBOARD, {
    variables: { ...dates, type: 'RESTAURANT', limit: 5 },
    fetchPolicy: 'cache-and-network',
  });

  const { data: ridersData, loading: ridersLoading } = useQuery<{
    ratingsLeaderboard: IRatedEntity[];
  }>(GET_RATINGS_LEADERBOARD, {
    variables: { ...dates, type: 'RIDER', limit: 5 },
    fetchPolicy: 'cache-and-network',
  });

  const { data: reviewsData, loading: reviewsLoading } = useQuery<{
    adminReviews: IAdminReviewsPage;
  }>(GET_ADMIN_REVIEWS, {
    variables: {
      ...dates,
      page,
      limit,
      withCommentsOnly: reviewFilter === 'COMMENTS',
      category: reviewFilter === 'LOW' ? lowCategory : null,
      maxStars: reviewFilter === 'LOW' ? LOW_RATING_MAX_STARS : null,
    },
    fetchPolicy: 'cache-and-network',
  });

  const summary = summaryData?.ratingsSummary;

  const changeFilter = (value: TReviewFilter) => {
    setReviewFilter(value);
    setPage(1);
  };

  const columns = [
    {
      headerName: t('Date'),
      propertyName: 'createdAt',
      body: (row: IAdminReview) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
    },
    {
      headerName: t('ratings_order'),
      propertyName: 'orderId',
      body: (row: IAdminReview) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.orderId ?? '-'}</span>
          <span className="text-xs text-gray-500">{row.customerName ?? ''}</span>
        </div>
      ),
    },
    {
      headerName: t('ratings_store'),
      propertyName: 'restaurantName',
      body: (row: IAdminReview) => row.restaurantName ?? '-',
    },
    {
      headerName: t('ratings_restaurant'),
      propertyName: 'rating',
      body: (row: IAdminReview) => <Stars value={row.rating} />,
    },
    {
      headerName: t('ratings_food'),
      propertyName: 'foodRating',
      body: (row: IAdminReview) => <Stars value={row.foodRating} />,
    },
    {
      headerName: t('ratings_rider'),
      propertyName: 'riderRating',
      body: (row: IAdminReview) => (
        <div className="flex flex-col">
          <Stars value={row.riderRating} />
          {row.riderName && (
            <span className="text-xs text-gray-500">{row.riderName}</span>
          )}
        </div>
      ),
    },
    {
      headerName: t('ratings_ordo_service'),
      propertyName: 'serviceRating',
      body: (row: IAdminReview) => <Stars value={row.serviceRating} />,
    },
    {
      headerName: t('ratings_comment'),
      propertyName: 'comments',
      body: (row: IAdminReview) =>
        row.tags?.length || row.comments ? (
          <div className="max-w-xs">
            <ReviewTags tags={row.tags} />
            {row.comments && (
              <span className="mt-1 line-clamp-3 block text-sm">{row.comments}</span>
            )}
          </div>
        ) : (
          <span className="text-sm">-</span>
        ),
    },
  ];

  const filterButton = (value: TReviewFilter, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => changeFilter(value)}
      className={`rounded-full border px-4 py-1.5 text-sm ${
        reviewFilter === value
          ? 'border-primary-color bg-primary-color text-white'
          : 'border-gray-300 text-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="screen-container p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <HeaderText className="heading" text={t('ratings_summary')} />
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col text-gray-500">
            {t('ratings_from')}
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 text-gray-800"
            />
          </label>
          <label className="flex flex-col text-gray-500">
            {t('ratings_to')}
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 text-gray-800"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="rounded border border-gray-300 px-3 py-1 text-gray-600"
            >
              {t('ratings_clear_dates')}
            </button>
          )}
        </div>
      </div>

      {/* Totals */}
      <p className="mt-2 text-sm text-gray-500">
        {summaryLoading && !summary
          ? ' '
          : t('ratings_totals', {
              total: summary?.totalReviews ?? 0,
              comments: summary?.withComments ?? 0,
            })}
      </p>

      {/* Category averages */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((category) =>
          summaryLoading && !summary ? (
            <Skeleton key={category.key} height="11rem" />
          ) : (
            <StatCard
              key={category.key}
              title={t(category.label)}
              stat={summary?.[category.statKey]}
            />
          )
        )}
      </div>

      {/* Most picked quick-tap feedback */}
      {!!summary?.topTags?.length && (
        <div className="mt-4 rounded-lg border border-gray-200 p-4">
          <p className="mb-3 font-medium">{t('ratings_top_feedback')}</p>
          <div className="flex flex-wrap gap-2">
            {summary.topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-sm ${
                  NEGATIVE_REVIEW_TAGS.has(tag)
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {reviewTagLabel(tag)} · {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lowest rated */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Leaderboard
          title={t('ratings_lowest_stores')}
          rows={storesData?.ratingsLeaderboard}
          loading={storesLoading}
        />
        <Leaderboard
          title={t('ratings_lowest_riders')}
          rows={ridersData?.ratingsLeaderboard}
          loading={ridersLoading}
        />
      </div>

      {/* Reviews */}
      <div className="mt-6">
        <p className="mb-3 font-medium">{t('ratings_all_reviews')}</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filterButton('ALL', t('All'))}
          {filterButton('COMMENTS', t('ratings_with_comments'))}
          {filterButton('LOW', t('ratings_low_ratings'))}
          {reviewFilter === 'LOW' && (
            <select
              value={lowCategory}
              onChange={(e) => {
                setLowCategory(e.target.value as TRatingCategory);
                setPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((category) => (
                <option key={category.key} value={category.key}>
                  {t(category.label)}
                </option>
              ))}
            </select>
          )}
        </div>

        <Table
          data={reviewsData?.adminReviews?.reviews ?? []}
          columns={columns}
          loading={reviewsLoading}
          moduleName="Ratings-Summary"
          rowsPerPage={limit}
          totalRecords={reviewsData?.adminReviews?.total ?? 0}
          currentPage={page}
          onPageChange={(nextPage, rows) => {
            setPage(nextPage);
            setLimit(rows);
          }}
          scrollHeight="560px"
        />
      </div>
    </div>
  );
}
