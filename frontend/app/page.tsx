import { CSVProcessor } from "@/components/csv-processor"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">CSV File Processor</h1>
      <CSVProcessor />
    </main>
  )
}

