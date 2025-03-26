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
  totalRows: number
  columns: string[]
}

export type StoreMetricsData = {
  wm_time_window_week: string;
  all_links_item_description: string;
  all_links_item_number: string;
  base_unit_retail_amount: number;
  brand_id: string;
  brand_name: string;
  buyer_name: string;
  consumer_id: string;
  country_of_origin: string;
  omni_category_group_description: string;
  omni_department_number: string;
  season_description: string;
  season_year: string;
  walmart_upc_number: string;
  vendor_name: string;
  vendor_number: string;
  store_number: string;
  city_name: string;
  'all_links_item_number/store_number/city_name': string;
  catalog_item_id: string;
  l4w_units_per_str_with_sales_per_week_or_per_day_ty: number;
  units_per_str_with_sales_per_week_or_per_day_ty: number;
  l4w_dollar_per_str_with_sales_per_week_or_per_day_ty: number;
  dollar_per_str_with_sales_per_week_or_per_day_ty: number;
  instock_percentage_this_year: number;
  store_in_transit_quantity_this_year: number;
  store_in_warehouse_quantity_this_year: number;
  store_on_hand_quantity_this_year: number;
  store_on_order_quantity_this_year: number;
  l4w_pos_quantity_this_year: number;
  pos_quantity_this_year: number;
  average_weekly_sales: number;
  pipeline: number;
  in_store: number;
  pipeline_iw_it: number;
  wos_with_instore_pipeline: number | null;
  units_per_case_pack: number | null;
  case_packs: null;
  total_units: null;
};

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
              message: `Uploading file: ${Math.round(percentComplete)}%`
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
      message: `Processing data: ${uploadResult.rowCount} of ${uploadResult.totalRows} rows (${Math.round((uploadResult.rowCount / uploadResult.totalRows) * 100)}%)`
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

export async function fetchStoreMetrics(): Promise<StoreMetricsData[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/store-metrics`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching store metrics:', error);
    throw error;
  }
}

