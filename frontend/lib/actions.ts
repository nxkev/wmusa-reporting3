import type { CSVData } from "@/components/csv-processor"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export type UploadProgress = {
  status: 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
}

type UploadResponse = {
  message: string
  rowCount: number
  columns: string[]
}

export async function processCSV(
  fileOrUrl: File | string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{
  data: CSVData[]
  columns: string[]
  numericFields: string[]
}> {
  try {
    let uploadResponse: Response;
    let uploadResult: UploadResponse;
    
    if (typeof fileOrUrl === "string") {
      // Handle URL case
      onProgress?.({
        status: 'uploading',
        progress: 0,
        message: 'Starting URL download...'
      });
      
      uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fileOrUrl }),
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Failed to upload: ${uploadResponse.statusText}`);
      }
      
      uploadResult = await uploadResponse.json();
    } else {
      // Handle file upload case with progress
      const formData = new FormData();
      formData.append('file', fileOrUrl);
      
      onProgress?.({
        status: 'uploading',
        progress: 0,
        message: 'Starting file upload...'
      });

      uploadResult = await new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress?.({
              status: 'uploading',
              progress: percentComplete,
              message: `Uploading: ${Math.round(percentComplete)}%`
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Upload failed: ${xhr.statusText}`));
            } catch (error) {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `${API_BASE_URL}/upload`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(formData);
      });
    }

    onProgress?.({
      status: 'processing',
      progress: 50,
      message: 'Processing uploaded file...'
    });

    console.log('Upload successful:', uploadResult);

    // Small delay to ensure database is ready
    await new Promise(resolve => setTimeout(resolve, 500));

    onProgress?.({
      status: 'processing',
      progress: 75,
      message: 'Getting schema information...'
    });

    // Get the first page of data
    const dataResponse = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT * FROM store_metrics',
        page: 1,
        limit: 100
      }),
    });

    if (!dataResponse.ok) {
      const errorData = await dataResponse.json();
      throw new Error(errorData.error || 'Failed to fetch data');
    }

    const { data, total } = await dataResponse.json();
    console.log(`Fetched ${data.length} rows out of ${total}`);

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data returned from the server');
    }

    // Get schema to identify numeric fields
    const schemaResponse = await fetch(`${API_BASE_URL}/schema`);
    if (!schemaResponse.ok) {
      const errorData = await schemaResponse.json();
      throw new Error(errorData.error || 'Failed to get schema');
    }
    const schema = await schemaResponse.json();

    // Identify numeric fields based on schema and first row of data
    const numericFields = Object.keys(data[0]).filter(key => {
      const value = data[0][key];
      // Handle null, undefined, or empty string values
      if (!value || value === '') return false;
      // Try to convert to number after removing currency symbols and commas
      const cleanValue = String(value).replace(/[$,]/g, '');
      return !isNaN(Number(cleanValue));
    });

    onProgress?.({
      status: 'complete',
      progress: 100,
      message: 'Upload complete!'
    });

    return {
      data: data.map((row: any, index: number) => ({
        id: `row-${index}`,
        ...row,
      })),
      columns: Object.keys(data[0]),
      numericFields,
    };
  } catch (error) {
    onProgress?.({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
    console.error('Error processing CSV:', error);
    throw error;
  }
}

