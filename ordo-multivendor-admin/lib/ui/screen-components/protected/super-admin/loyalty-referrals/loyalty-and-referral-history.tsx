'use client';

import { gql, useQuery } from '@apollo/client';
import Table from '@/lib/ui/useable-components/table';
import { toTextCase } from '@/lib/utils/methods';
import { useMemo, useState } from 'react';
import type { JSX } from 'react';

interface PaginatedHistoryResponse {
  data: HistoryRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface QueryData {
  fetchCustomerReferralLoyaltyHistory?: PaginatedHistoryResponse;
  fetchRiderReferralLoyaltyHistory?: PaginatedHistoryResponse;
}

interface HistoryRow {
  _id: string;
  user_name: string;
  user_rank: string;
  type: string;
  level: number;
  value: number;
  rewardRole: string;
  createdAt: string;
}

interface TableColumn {
  propertyName: string;
  headerName: string;
  body?: (rowData: HistoryRow) => JSX.Element;
  hidden?: boolean;
}

type SourceFilter = 'all' | 'direct' | 'residual';
type EntityTab = 'customer' | 'rider';

const FETCH_CUSTOMER_HISTORY = gql`
  query FetchCustomerReferralLoyaltyHistory(
    $filter: FetchLoyaltyReferralHistoryFilterInput
  ) {
    fetchCustomerReferralLoyaltyHistory(filter: $filter) {
      data {
        _id
        user_name
        user_rank
        type
        level
        value
        rewardRole
        createdAt
      }
      totalCount
      totalPages
      currentPage
      hasNextPage
      hasPrevPage
    }
  }
`;

const FETCH_RIDER_HISTORY = gql`
  query FetchRiderReferralLoyaltyHistory(
    $filter: FetchLoyaltyReferralHistoryFilterInput
  ) {
    fetchRiderReferralLoyaltyHistory(filter: $filter) {
      data {
        _id
        user_name
        user_rank
        type
        level
        value
        rewardRole
        createdAt
      }
      totalCount
      totalPages
      currentPage
      hasNextPage
      hasPrevPage
    }
  }
`;

export default function LoyaltyAndReferralHistoryComponent() {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [entityTab, setEntityTab] = useState<EntityTab>('customer');

  // API
  const activeQuery = entityTab === 'customer' ? FETCH_CUSTOMER_HISTORY : FETCH_RIDER_HISTORY;
  const responseKey =
    entityTab === 'customer'
      ? 'fetchCustomerReferralLoyaltyHistory'
      : 'fetchRiderReferralLoyaltyHistory';

  const { data, loading, refetch } = useQuery<QueryData>(activeQuery, {
    variables: {
      filter: {
        page: currentPage,
        limit: rowsPerPage,
      },
    },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  
  // Process data for table
  const tableData = useMemo(() => {
    const logs = data?.[responseKey]?.data || [];
    const rows = logs.filter(Boolean) as HistoryRow[];
    if (sourceFilter === 'direct') return rows.filter(r => r.rewardRole === 'SELF');
    if (sourceFilter === 'residual') return rows.filter(r => r.rewardRole !== 'SELF');
    return rows;
  }, [data, sourceFilter, responseKey]);

  const totalCount = data?.[responseKey]?.totalCount || 0;

  // Pagination handler
  const handlePageChange = (page: number, rows: number) => {
    console.log('handlePageChange called:', { page, rows });
    setCurrentPage(page);
    setRowsPerPage(rows);
    
    // Manually trigger refetch with new variables
    refetch({
      filter: {
        page,
        limit: rows,
      },
    });
  };

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      propertyName: 'user_name',
      headerName: entityTab === 'customer' ? 'Customer Name' : 'Rider Name',
      body: (rowData: HistoryRow) => (
        <span className="text-foreground dark:text-white text-sm">{rowData.user_name}</span>
      ),
    },
    {
      propertyName: 'user_rank',
      headerName: 'Rank',
      body: (rowData: HistoryRow) => (
        <span className="text-foreground dark:text-white text-sm font-medium">
          {toTextCase(rowData.user_rank, 'title')}
        </span>
      ),
    },
    {
      propertyName: 'rewardRole',
      headerName: 'Source',
      body: (rowData: HistoryRow) => {
        const isDirect = rowData.rewardRole === 'SELF';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              isDirect
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            {isDirect ? 'Direct' : 'Residual'}
          </span>
        );
      },
    },
    {
      propertyName: 'value',
      headerName: 'Total Points',
      body: (rowData: HistoryRow) => (
        <span className="text-foreground dark:text-white text-sm font-medium">{rowData.value}</span>
      ),
    },
    {
      propertyName: 'type',
      headerName: 'Type',
      body: (rowData: HistoryRow) => (
        <span className="text-foreground dark:text-white text-sm font-medium">{rowData.type}</span>
      ),
    },
    {
      propertyName: 'level',
      headerName: 'Tier',
      body: (rowData: HistoryRow) => (
        <span className="text-foreground dark:text-white text-sm font-medium">
          {rowData.level ? `Level ${rowData.level}` : 'Level'}
        </span>
      ),
    },
    {
      propertyName: 'createdAt',
      headerName: 'Last Purchase',
      body: (rowData: HistoryRow) => (
        <span className="text-foreground dark:text-white text-sm font-medium">
          {new Date(parseInt(rowData.createdAt)).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="m-3 p-6 border border-border rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Invite &amp; Earn History
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#F4F4F5] dark:bg-dark-600 rounded-lg p-1 gap-1">
            {(['customer', 'rider'] as EntityTab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setEntityTab(t);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                  entityTab === t
                    ? 'bg-white dark:bg-dark-900 text-foreground dark:text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'customer' ? 'Customer' : 'Rider'}
              </button>
            ))}
          </div>
          <div className="flex bg-[#F4F4F5] dark:bg-dark-600 rounded-lg p-1 gap-1">
            {(['all', 'direct', 'residual'] as SourceFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSourceFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                  sourceFilter === f
                    ? 'bg-white dark:bg-dark-900 text-foreground dark:text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : f === 'direct' ? 'Direct' : 'Residual'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Table
        data={tableData}
        columns={columns}
        loading={loading}
        rowsPerPage={rowsPerPage}
        className="loyalty-history-table"
        totalRecords={totalCount}
        onPageChange={handlePageChange}
        currentPage={currentPage}
      />
    </div>
  );
}
