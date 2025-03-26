"use client"

import { useState } from "react"
import { FileUploader } from "./file-uploader"
import { DataTable } from "./data-table"
import { processCSV, type UploadProgress } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { downloadCSV } from "@/lib/utils"
import { useDropzone } from 'react-dropzone'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

export type CSVData = Record<string, string | number>

export type FilterCondition = {
  field: string
  operator: "equals" | "greaterThan" | "lessThan"
  value: number
}

interface CSVProcessorProps {
  onProcessingComplete?: () => void;
  onProcessingStart?: () => void;
}

export const CSVProcessor = ({ onProcessingComplete, onProcessingStart }: CSVProcessorProps) => {
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
  const [url, setUrl] = useState("")

  const handleFileProcessed = async (file: File) => {
    try {
      setError(null)
      setUploadProgress({
        status: 'uploading',
        progress: 0,
        message: 'Starting upload...'
      })
      
      // Notify that processing has started
      onProcessingStart?.()

      await processCSV(file, (progress) => {
        setUploadProgress(progress)
      })

      // Notify parent component that processing is complete
      onProcessingComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file')
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Upload failed'
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileProcessed(file)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url) {
      handleFileProcessed(new File([], url))
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
    <FileUploader onUploadComplete={onProcessingComplete} />
  )
}

