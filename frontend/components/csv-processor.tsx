"use client"

import { useState } from "react"
import { FileUploader } from "./file-uploader"
import { DataTable } from "./data-table"
import { processCSV, type UploadProgress } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { downloadCSV } from "@/lib/utils"
import { useDropzone } from 'react-dropzone'

export type CSVData = Record<string, string | number>

export type FilterCondition = {
  field: string
  operator: "equals" | "greaterThan" | "lessThan"
  value: number
}

export const CSVProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CSVData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [numericFields, setNumericFields] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [bulkUpdateField, setBulkUpdateField] = useState<string>("")
  const [bulkUpdateValue, setBulkUpdateValue] = useState<number>(0)
  const [modifiedData, setModifiedData] = useState<CSVData[]>([])
  const [isModified, setIsModified] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  const handleFileProcessed = async (file: File | string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const result = await processCSV(file, (progress) => {
        setUploadProgress(progress)
      })
      setData(result.data)
      setColumns(result.columns)
      setNumericFields(result.numericFields)
      setModifiedData(result.data)
    } catch (error) {
      console.error("Error processing file:", error)
      setError(error instanceof Error ? error.message : 'Error processing file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyFilters = () => {
    if (filters.length === 0) {
      setModifiedData(data)
      return
    }

    const filtered = data.filter((row) => {
      return filters.every((filter) => {
        const fieldValue = Number(row[filter.field])

        switch (filter.operator) {
          case "equals":
            return fieldValue === filter.value
          case "greaterThan":
            return fieldValue > filter.value
          case "lessThan":
            return fieldValue < filter.value
          default:
            return true
        }
      })
    })

    setModifiedData(filtered)
  }

  const applyBulkUpdate = () => {
    if (!bulkUpdateField) return

    const updated = modifiedData.map((row) => ({
      ...row,
      [bulkUpdateField]: bulkUpdateValue,
    }))

    setModifiedData(updated)
    setIsModified(true)
  }

  const handleExport = () => {
    if (modifiedData.length === 0) return

    const csvContent = [columns.join(","), ...modifiedData.map((row) => columns.map((col) => row[col]).join(","))].join(
      "\n",
    )

    downloadCSV(csvContent, "processed_data.csv")
  }

  const resetChanges = () => {
    setModifiedData(data)
    setIsModified(false)
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    setError(null)
    setUploadProgress(null)
    
    try {
      const file = acceptedFiles[0]
      const result = await processCSV(file, (progress) => {
        setUploadProgress(progress)
      })
      
      setData(result.data)
      setColumns(result.columns)
      setNumericFields(result.numericFields)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  })

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {uploadProgress && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              {uploadProgress.message}
            </span>
            <span className="text-sm font-medium">
              {Math.round(uploadProgress.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                uploadProgress.status === 'error' ? 'bg-red-600' :
                uploadProgress.status === 'complete' ? 'bg-green-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {!data.length ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <svg 
              className="w-12 h-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg">
              {isDragActive ? 
                'Drop your CSV file here' : 
                'Drag and drop your CSV file here or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV files of any size
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Data Preview</h2>
            <div className="space-x-2">
              <Button onClick={() => {
                setData([]);
                setError(null);
              }} variant="outline">
                Upload New File
              </Button>
              <Button onClick={handleExport} disabled={modifiedData.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>

          <DataTable
            data={modifiedData}
            columns={columns}
            numericFields={numericFields}
            filters={filters}
            setFilters={setFilters}
            applyFilters={applyFilters}
            bulkUpdateField={bulkUpdateField}
            setBulkUpdateField={setBulkUpdateField}
            bulkUpdateValue={bulkUpdateValue}
            setBulkUpdateValue={setBulkUpdateValue}
            applyBulkUpdate={applyBulkUpdate}
            isModified={isModified}
            resetChanges={resetChanges}
          />
        </>
      )}
    </div>
  )
}

