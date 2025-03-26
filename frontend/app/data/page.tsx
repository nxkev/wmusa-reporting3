"use client"

import { StoreMetricsTable } from '@/components/store-metrics-table'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DataPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Store Metrics Data</h1>
        <Button 
          variant="outline"
          onClick={() => router.push('/')}
        >
          Back to Upload
        </Button>
      </div>
      <StoreMetricsTable />
    </div>
  )
} 