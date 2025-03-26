"use client"

import { useState, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
  type HeaderGroup,
  type Row,
  type Cell,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

interface StoreMetric {
  wm_time_window_week: string
  all_links_item_description: string
  all_links_item_number: string
  base_unit_retail_amount: string
  brand_id: string
  brand_name: string
  buyer_name: string
  consumer_id: string
  country_of_origin: string
  omni_category_group_description: string
  omni_department_number: string
  season_description: string
  season_year: string
  walmart_upc_number: string
  vendor_name: string
  vendor_number: string
  store_number: string
  city_name: string
  catalog_item_id: string
  item_store_city: string
  dollar_per_str_with_sales_per_week_or_per_day_ty: number
  store_in_transit_quantity_this_year: number
  store_in_warehouse_quantity_this_year: number
  store_on_hand_quantity_this_year: number
  store_on_order_quantity_this_year: number
  pos_quantity_this_year: number
  l4w_pos_quantity_this_year: number
  average_weekly_sales: number
  units_per_str_with_sales_per_week_or_per_day_ty: number
  l4w_units_per_str_with_sales_per_week_or_per_day_ty: number
  l4w_dollar_per_str_with_sales_per_week_or_per_day_ty: number
  gross_receipt_quantity_this_year: number
  net_receipt_quantity_this_year: number
  total_store_customer_returns_quantity_defective_this_year: number
  instock_percentage_this_year: number
  repl_instock_percentage_this_year: number
  valid_store_count_this_year: number
  pos_quantity_this_year_1: number
  pos_quantity_this_year_2: number
  pipeline_iw_it: number
  wos_with_instore_pipeline: number | null
  units_per_case_pack: number | null
  case_packs: number | null
  total_units: number
}

export function StoreMetricsTable() {
  const [data, setData] = useState<StoreMetric[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  const columns: ColumnDef<StoreMetric>[] = [
    {
      accessorKey: "wm_time_window_week",
      header: "wm_time_window_week",
    },
    {
      accessorKey: "all_links_item_description",
      header: "all_links_item_description",
    },
    {
      accessorKey: "all_links_item_number",
      header: "all_links_item_number",
    },
    {
      accessorKey: "base_unit_retail_amount",
      header: "base_unit_retail_amount",
    },
    {
      accessorKey: "brand_id",
      header: "brand_id",
    },
    {
      accessorKey: "brand_name",
      header: "brand_name",
    },
    {
      accessorKey: "buyer_name",
      header: "buyer_name",
    },
    {
      accessorKey: "consumer_id",
      header: "consumer_id",
    },
    {
      accessorKey: "country_of_origin",
      header: "country_of_origin",
    },
    {
      accessorKey: "omni_category_group_description",
      header: "omni_category_group_description",
    },
    {
      accessorKey: "omni_department_number",
      header: "omni_department_number",
    },
    {
      accessorKey: "season_description",
      header: "season_description",
    },
    {
      accessorKey: "season_year",
      header: "season_year",
    },
    {
      accessorKey: "walmart_upc_number",
      header: "walmart_upc_number",
    },
    {
      accessorKey: "vendor_name",
      header: "vendor_name",
    },
    {
      accessorKey: "vendor_number",
      header: "vendor_number",
    },
    {
      accessorKey: "store_number",
      header: "store_number",
    },
    {
      accessorKey: "city_name",
      header: "city_name",
    },
    {
      accessorKey: "catalog_item_id",
      header: "catalog_item_id",
    },
    {
      accessorKey: "item_store_city",
      header: "item_store_city",
    },
    {
      accessorKey: "dollar_per_str_with_sales_per_week_or_per_day_ty",
      header: "dollar_per_str_with_sales_per_week_or_per_day_ty",
      cell: (info) => (info.getValue() as number)?.toFixed(2),
    },
    {
      accessorKey: "store_in_transit_quantity_this_year",
      header: "store_in_transit_quantity_this_year",
    },
    {
      accessorKey: "store_in_warehouse_quantity_this_year",
      header: "store_in_warehouse_quantity_this_year",
    },
    {
      accessorKey: "store_on_hand_quantity_this_year",
      header: "store_on_hand_quantity_this_year",
    },
    {
      accessorKey: "store_on_order_quantity_this_year",
      header: "store_on_order_quantity_this_year",
    },
    {
      accessorKey: "pos_quantity_this_year",
      header: "pos_quantity_this_year",
    },
    {
      accessorKey: "l4w_pos_quantity_this_year",
      header: "l4w_pos_quantity_this_year",
      cell: (info) => (info.getValue() as number)?.toFixed(2),
    },
    {
      accessorKey: "average_weekly_sales",
      header: "average_weekly_sales",
      cell: (info) => (info.getValue() as number)?.toFixed(2),
    },
    {
      accessorKey: "units_per_str_with_sales_per_week_or_per_day_ty",
      header: "units_per_str_with_sales_per_week_or_per_day_ty",
      cell: (info) => (info.getValue() as number)?.toFixed(2),
    },
    {
      accessorKey: "l4w_units_per_str_with_sales_per_week_or_per_day_ty",
      header: "l4w_units_per_str_with_sales_per_week_or_per_day_ty",
      cell: (info) => (info.getValue() as number)?.toFixed(2),
    },
    {
      accessorKey: "l4w_dollar_per_str_with_sales_per_week_or_per_day_ty",
      header: "l4w_dollar_per_str_with_sales_per_week_or_per_day_ty",
      cell: (info) => (info.getValue() as number)?.toFixed(2),
    },
    {
      accessorKey: "gross_receipt_quantity_this_year",
      header: "gross_receipt_quantity_this_year",
    },
    {
      accessorKey: "net_receipt_quantity_this_year",
      header: "net_receipt_quantity_this_year",
    },
    {
      accessorKey: "total_store_customer_returns_quantity_defective_this_year",
      header: "total_store_customer_returns_quantity_defective_this_year",
    },
    {
      accessorKey: "instock_percentage_this_year",
      header: "instock_percentage_this_year",
      cell: (info) => `${info.getValue()}%`,
    },
    {
      accessorKey: "repl_instock_percentage_this_year",
      header: "repl_instock_percentage_this_year",
      cell: (info) => `${info.getValue()}%`,
    },
    {
      accessorKey: "valid_store_count_this_year",
      header: "valid_store_count_this_year",
    },
    {
      accessorKey: "pos_quantity_this_year_1",
      header: "pos_quantity_this_year_1",
    },
    {
      accessorKey: "pos_quantity_this_year_2",
      header: "pos_quantity_this_year_2",
    },
    {
      accessorKey: "pipeline_iw_it",
      header: "pipeline_iw_it",
    },
    {
      accessorKey: "wos_with_instore_pipeline",
      header: "wos_with_instore_pipeline",
      cell: (info) => (info.getValue() as number)?.toFixed(2) || 'N/A',
    },
    {
      accessorKey: "units_per_case_pack",
      header: "units_per_case_pack",
      cell: (info) => info.getValue() || 'N/A',
    },
    {
      accessorKey: "case_packs",
      header: "case_packs",
      cell: (info) => (info.getValue() as number)?.toFixed(2) || 'N/A',
    },
    {
      accessorKey: "total_units",
      header: "total_units",
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/store-metrics')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const jsonData = await response.json()
        setData(jsonData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<StoreMetric>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className="bg-gray-100"
                    style={{ position: 'relative' }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-1'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="h-4 w-4" />,
                          desc: <ChevronDown className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? (
                          header.column.getCanSort() ? (
                            <ChevronsUpDown className="h-4 w-4" />
                          ) : null
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<StoreMetric>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell: Cell<StoreMetric, unknown>) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-gray-700">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          of {data.length} entries
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  )
} 