// Interface and Types
import {
  IDataTableProps,
  ITableExtends,
} from '@/lib/utils/interfaces/table.interface';

// Prime React
import { Column } from 'primereact/column';
import {
  DataTable,
  DataTableSelectionMultipleChangeEvent,
  DataTablePageEvent,
} from 'primereact/datatable';
import DataTableColumnSkeleton from '../custom-skeletons/datatable.column.skeleton';
import { useTranslations } from 'next-intl';
import { ProgressSpinner } from 'primereact/progressspinner';

const Table = <T extends ITableExtends>({
  header,
  data,
  selectedData,
  setSelectedData,
  columns,
  filters,
  size = 'small',
  loading,
  isSelectable = false,
  moduleName = 'Restaurant-Orders',
  handleRowClick,
  rowsPerPage = 10,
  className,
  scrollable = true,
  scrollHeight = '420px',
  // Server-side pagination props
  totalRecords,
  onPageChange,
  currentPage = 1,
  minWidth,
  globalFilterFields,
}: IDataTableProps<T>) => {
  const handleSelectionChange = (
    e: DataTableSelectionMultipleChangeEvent<T[]>
  ) => {
    if (setSelectedData) {
      setSelectedData(e.value);
    }
  };

  // Hooks
  const t = useTranslations();

  // Handlers
  const handlePageChange = (event: DataTablePageEvent) => {
    if (onPageChange) {
      // Calculate page number (PrimeReact uses 0-based indexing for first)
      const page = Math.floor(event.first / event.rows) + 1;
      console.log('Page change:', { page, rows: event.rows, first: event.first });
      onPageChange(page, event.rows);
    }
  };

  const isServerPaginated = Boolean(onPageChange && totalRecords !== undefined);

  // Calculate if pagination should be shown
  const shouldShowPagination = isServerPaginated
    ? (totalRecords || 0) > rowsPerPage
    : data.length > rowsPerPage;

  const rowClassName = (data: T) => {
    let className = '';
    switch (moduleName) {
      case 'Restaurant-Order':
        className = data?.orderStatus === 'ASSIGNED' ? 'row-assigned' : '';
        break;
      case 'SuperAdmin-Order':
        className = data?.orderStatus === 'ASSIGNED' ? 'row-assigned' : '';
        break;
      default:
        break;
    }
    return `${className} ${handleRowClick ? 'hover-clickable-row' : ''}`;
  };

  // Prepare pagination props based on server pagination status
  const paginationProps = isServerPaginated && shouldShowPagination
    ? {
        lazy: true,
        first: (currentPage - 1) * rowsPerPage,
        totalRecords: totalRecords,
        onPage: handlePageChange,
      }
    : {};



  return (
    <>
      <DataTable
        header={header}
        paginator={shouldShowPagination}
        rows={rowsPerPage}
        rowsPerPageOptions={[10, 15, 25, 50]}
        value={data}
        selectionAutoFocus={true}
        size={size}
        selection={isSelectable ? selectedData || [] : []}
        onSelectionChange={isSelectable ? handleSelectionChange : undefined}
        className={className}
        dataKey="_id"
        tableStyle={{
          minWidth: minWidth ? minWidth : '50rem',
          minHeight: 'auto',
          maxHeight: '480px',
        }}
        selectionMode={isSelectable ? 'checkbox' : null}
        filters={filters}
        globalFilterFields={globalFilterFields}
        scrollable={scrollable}
        scrollHeight={scrollHeight}
        removableSort
        rowClassName={rowClassName}
        onRowClick={handleRowClick}
        emptyMessage={
          loading ? (
            <div className="flex justify-center items-center h-full">
              <ProgressSpinner
                style={{ width: '20px', height: '20px' }}
                strokeWidth="6"
                fill="transparent"
                animationDuration=".5s"
                className="text-black"
              />
            </div>
          ) : (
            t('No Data Available')
          )
        }
        {...paginationProps}
      >
        {isSelectable && (
          <Column
            selectionMode="multiple"
            headerStyle={{ width: '3rem' }}
          ></Column>
        )}
        {columns.map((col, index) => (
          <Column
            key={index}
            field={col?.propertyName}
            header={col?.headerName}
            className="dark:text-white"
            headerClassName="dark:text-white dark:bg-dark-900"
            footerClassName="dark:text-white dark:bg-dark-900"
            sortable={!col?.propertyName?.includes('action')}
            hidden={col?.hidden}
            bodyClassName="selectable-column"
            body={loading ? <DataTableColumnSkeleton /> : col.body}
          />
        ))}
      </DataTable>
    </>
  );
};

export default Table;
