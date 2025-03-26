"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, Link } from "lucide-react"

interface FileUploaderProps {
  onFileProcessed: (file: File | string) => void
  isProcessing: boolean
}

export const FileUploader = ({ onFileProcessed, isProcessing }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string>("")
  const [dragActive, setDragActive] = useState<boolean>(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = () => {
    if (file) {
      onFileProcessed(file)
    }
  }

  const handleUrlUpload = () => {
    if (url) {
      onFileProcessed(url)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>Upload a CSV file or provide a URL to a CSV file to process</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center ${
                dragActive ? "border-primary bg-primary/10" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-10 w-10 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Drag and drop your CSV file here or click to browse</p>
                  <p className="text-xs text-gray-500">Supports CSV files of any size</p>
                </div>
                <Input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                  Browse Files
                </Button>
              </div>
            </div>
            {file && (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm truncate max-w-[70%]">{file.name}</span>
                <Button onClick={handleFileUpload} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process File"
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-gray-400" />
                <Input placeholder="https://example.com/data.csv" value={url} onChange={handleUrlChange} />
              </div>
              <Button className="w-full" onClick={handleUrlUpload} disabled={!url || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process URL"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

