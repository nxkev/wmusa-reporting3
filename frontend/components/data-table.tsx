"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Filter, RefreshCw } from "lucide-react"
import type { CSVData, FilterCondition } from "./csv-processor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DataTableProps {
  data: CSVData[]
  columns: string[]
  numericFields: string[]
  filters: FilterCondition[]
  setFilters: (filters: FilterCondition[]) => void
  applyFilters: () => void
  bulkUpdateField: string
  setBulkUpdateField: (field: string) => void
  bulkUpdateValue: number
  setBulkUpdateValue: (value: number) => void
  applyBulkUpdate: () => void
  isModified: boolean
  resetChanges: () => void
}

export const DataTable = ({
  data,
  columns,
  numericFields,
  filters,
  setFilters,
  applyFilters,
  bulkUpdateField,
  setBulkUpdateField,
  bulkUpdateValue,
  setBulkUpdateValue,
  applyBulkUpdate,
  isModified,
  resetChanges,
}: DataTableProps) => {
  const [page, setPage] = useState(1)
  const rowsPerPage = 10
  const totalPages = Math.ceil(data.length / rowsPerPage)

  const addFilter = () => {
    if (numericFields.length === 0) return

    setFilters([
      ...filters,
      {
        field: numericFields[0],
        operator: "equals",
        value: 0,
      },
    ])
  }

  const updateFilter = (index: number, field: keyof FilterCondition, value: any) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setFilters(newFilters)
  }

  const removeFilter = (index: number) => {
    const newFilters = [...filters]
    newFilters.splice(index, 1)
    setFilters(newFilters)
  }

  const paginatedData = data.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Filters</span>
            <Button variant="outline" size="sm" onClick={addFilter} disabled={numericFields.length === 0}>
              <Filter className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filters.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No filters applied. Add a filter to narrow down results.
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Select value={filter.field} onValueChange={(value) => updateFilter(index, "field", value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(index, "operator", value as FilterCondition["operator"])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="greaterThan">Greater Than</SelectItem>
                      <SelectItem value="lessThan">Less Than</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, "value", Number(e.target.value))}
                    className="w-[120px]"
                  />

                  <Button variant="ghost" size="sm" onClick={() => removeFilter(index)}>
                    Remove
                  </Button>
                </div>
              ))}

              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Update</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Field to Update</label>
              <Select value={bulkUpdateField} onValueChange={setBulkUpdateField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">New Value</label>
              <Input
                type="number"
                value={bulkUpdateValue}
                onChange={(e) => setBulkUpdateValue(Number(e.target.value))}
              />
            </div>

            <Button onClick={applyBulkUpdate} disabled={!bulkUpdateField} className="mb-0">
              Update {data.length} Rows
            </Button>
          </div>
        </CardContent>
      </Card>

      {isModified && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data has been modified</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You have made changes to the data. Export to save your changes.</span>
            <Button variant="outline" size="sm" onClick={resetChanges}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>
                  {column}
                  {numericFields.includes(column) && (
                    <Badge variant="outline" className="ml-2">
                      Numeric
                    </Badge>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`}>{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  No data to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

