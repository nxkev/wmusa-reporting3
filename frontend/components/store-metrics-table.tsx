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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  store_in_transit_quantity_this_year: number
  store_in_warehouse_quantity_this_year: number
  store_on_hand_quantity_this_year: number
  store_on_order_quantity_this_year: number
  pos_quantity_this_year: number
  l4w_pos_quantity_this_year: number
  average_weekly_sales: number
  units_per_str_with_sales_per_week_or_per_day_ty: number
  l4w_units_per_str_with_sales_per_week_or_per_day_ty: number
  dollar_per_str_with_sales_per_week_or_per_day_ty: number
  l4w_dollar_per_str_with_sales_per_week_or_per_day_ty: number
  gross_receipt_quantity_this_year: number
  net_receipt_quantity_this_year: number
  total_store_customer_returns_quantity_defective_this_year: number
  instock_percentage_this_year: number
  repl_instock_percentage_this_year: number
  valid_store_count_this_year: number
  pipeline_iw_it: number
  wos_with_instore_pipeline: number | null
  units_per_case_pack: number | null
  case_packs: number | null
  total_units: number
}

const formatNumber = (value: number | null) => {
  if (value === null) return '-'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`
}

export function StoreMetricsTable() {
  const [data, setData] = useState<StoreMetric[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [pageSize, setPageSize] = useState(50)

  const columns: ColumnDef<StoreMetric>[] = [
    {
      accessorKey: "wm_time_window_week",
      header: "Week",
    },
    {
      accessorKey: "all_links_item_description",
      header: "Item Description",
    },
    {
      accessorKey: "all_links_item_number",
      header: "Item Number",
    },
    {
      accessorKey: "base_unit_retail_amount",
      header: "Base Unit Retail",
    },
    {
      accessorKey: "brand_id",
      header: "Brand ID",
    },
    {
      accessorKey: "brand_name",
      header: "Brand Name",
    },
    {
      accessorKey: "buyer_name",
      header: "Buyer Name",
    },
    {
      accessorKey: "consumer_id",
      header: "Consumer ID",
    },
    {
      accessorKey: "country_of_origin",
      header: "Country of Origin",
    },
    {
      accessorKey: "omni_category_group_description",
      header: "Category Group",
    },
    {
      accessorKey: "omni_department_number",
      header: "Department Number",
    },
    {
      accessorKey: "season_description",
      header: "Season",
    },
    {
      accessorKey: "season_year",
      header: "Season Year",
    },
    {
      accessorKey: "walmart_upc_number",
      header: "UPC Number",
    },
    {
      accessorKey: "vendor_name",
      header: "Vendor Name",
    },
    {
      accessorKey: "vendor_number",
      header: "Vendor Number",
    },
    {
      accessorKey: "store_number",
      header: "Store Number",
    },
    {
      accessorKey: "city_name",
      header: "City",
    },
    {
      accessorKey: "catalog_item_id",
      header: "Catalog Item ID",
    },
    {
      accessorKey: "item_store_city",
      header: "Item/Store/City",
    },
    {
      accessorKey: "store_in_transit_quantity_this_year",
      header: "In Transit Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "store_in_warehouse_quantity_this_year",
      header: "In Warehouse Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "store_on_hand_quantity_this_year",
      header: "On Hand Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "store_on_order_quantity_this_year",
      header: "On Order Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "pos_quantity_this_year",
      header: "POS Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "l4w_pos_quantity_this_year",
      header: "L4W POS Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "average_weekly_sales",
      header: "Avg Weekly Sales",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "units_per_str_with_sales_per_week_or_per_day_ty",
      header: "Units/Store/Week",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "l4w_units_per_str_with_sales_per_week_or_per_day_ty",
      header: "L4W Units/Store/Week",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "dollar_per_str_with_sales_per_week_or_per_day_ty",
      header: "$/Store/Week",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "l4w_dollar_per_str_with_sales_per_week_or_per_day_ty",
      header: "L4W $/Store/Week",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "gross_receipt_quantity_this_year",
      header: "Gross Receipt Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "net_receipt_quantity_this_year",
      header: "Net Receipt Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "total_store_customer_returns_quantity_defective_this_year",
      header: "Returns Qty",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "instock_percentage_this_year",
      header: "In-Stock %",
      cell: (info) => formatPercentage(info.getValue() as number),
    },
    {
      accessorKey: "repl_instock_percentage_this_year",
      header: "Repl In-Stock %",
      cell: (info) => formatPercentage(info.getValue() as number),
    },
    {
      accessorKey: "valid_store_count_this_year",
      header: "Valid Store Count",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "pipeline_iw_it",
      header: "Pipeline IW/IT",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "wos_with_instore_pipeline",
      header: "WOS w/Pipeline",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "units_per_case_pack",
      header: "Units/Case",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "case_packs",
      header: "Case Packs",
      cell: (info) => formatNumber(info.getValue() as number),
    },
    {
      accessorKey: "total_units",
      header: "Total Units",
      cell: (info) => formatNumber(info.getValue() as number),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">Error: {error}</div>
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
        <div className="flex items-center gap-2">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value))
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="250">250 per page</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronsUpDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
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

      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} rows total
        </div>
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
    </div>
  )
} 