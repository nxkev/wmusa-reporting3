"use client"

import { useRouter } from 'next/navigation'
import { FileUploader } from '@/components/file-uploader'
import { DatabaseStatus } from '@/components/database-status'

export default function Home() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Store Metrics Upload</h1>
        <DatabaseStatus />
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <FileUploader 
            onUploadComplete={() => router.push('/data')}
          />
        </div>
      </div>
    </div>
  )
}

