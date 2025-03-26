"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DatabaseStatus {
  initialized: boolean
  tableExists: boolean
  rowCount: number
  dbSizeBytes: number
  dbSizeMB: number
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/db-status')
      if (!response.ok) {
        throw new Error('Failed to fetch database status')
      }
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true)
      const response = await fetch('/api/db-cleanup', {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to clean database')
      }
      await fetchStatus() // Refresh status after cleanup
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean database')
    } finally {
      setIsCleaningUp(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-red-800">{error}</p>
      </Card>
    )
  }

  if (!status) {
    return null
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold mb-2">Database Status</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={status.initialized ? 'text-green-600' : 'text-red-600'}>
                {status.initialized ? 'Initialized' : 'Not Initialized'}
              </span>
            </p>
            <p>
              <span className="font-medium">Store Metrics Table:</span>{' '}
              <span className={status.tableExists ? 'text-green-600' : 'text-red-600'}>
                {status.tableExists ? 'Exists' : 'Not Found'}
              </span>
            </p>
            <p>
              <span className="font-medium">Total Records:</span>{' '}
              {status.rowCount.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Database Size:</span>{' '}
              {status.dbSizeMB.toFixed(2)} MB
            </p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm"
              disabled={!status.initialized || !status.tableExists || status.rowCount === 0 || isCleaningUp}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clean DB
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clean Database</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all records from the database. This action cannot be undone.
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCleanup}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCleaningUp ? 'Cleaning...' : 'Yes, Clean Database'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
} 