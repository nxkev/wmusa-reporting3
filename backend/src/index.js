import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize SQLite database
let db = null;
let dbInitialized = false;

const initDb = async () => {
  if (dbInitialized) return true;
  
  try {
    console.log('Initializing database...');
    
    // Ensure the database file exists and is writable
    const dbPath = '/app/data.db';
    console.log('Database path:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      console.log('Creating new database file');
      fs.writeFileSync(dbPath, '');
    }
    
    // Close existing connection if any
    if (db) {
      console.log('Closing existing database connection');
      await db.close();
    }
    
    console.log('Opening database connection');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Database initialized successfully');
    dbInitialized = true;
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    dbInitialized = false;
    db = null;
    return false;
  }
};

// Initialize database before starting server
const startServer = async () => {
  try {
    // Ensure data and uploads directories exist
    const dataDir = join(__dirname, '../data');
    const uploadsDir = join(__dirname, '../uploads');
    
    if (!fs.existsSync(dataDir)) {
      console.log('Creating data directory');
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Initialize database
    const initialized = await initDb();
    if (!initialized) {
      console.error('Failed to initialize database');
      process.exit(1);
    }
    
    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileStream = fs.createReadStream(req.file.path);
    const parser = parse({
      columns: true,
      skip_empty_lines: true
    });

    let columns = null;
    const BATCH_SIZE = 1000;
    let currentBatch = [];
    let totalRows = 0;
    let processedRows = 0;

    // First pass: count total rows
    const countStream = fs.createReadStream(req.file.path);
    const countParser = parse({
      columns: true,
      skip_empty_lines: true
    });
    
    for await (const _ of countStream.pipe(countParser)) {
      totalRows++;
    }

    // Second pass: process data
    for await (const row of fileStream.pipe(parser)) {
      if (!columns) {
        columns = Object.keys(row);
        
        // Drop existing table
        await db.exec('DROP TABLE IF EXISTS store_metrics');
        
        // Create table dynamically based on CSV columns
        const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
        await db.exec(`CREATE TABLE store_metrics (${columnDefs})`);
      }

      currentBatch.push(row);
      
      // Process batch when it reaches the size limit
      if (currentBatch.length >= BATCH_SIZE) {
        await processBatch(currentBatch, columns);
        processedRows += currentBatch.length;
        currentBatch = [];
        
        // Send progress update
        const progress = Math.round((processedRows / totalRows) * 100);
        console.log(`Processing progress: ${progress}%`);
      }
    }

    // Process remaining rows
    if (currentBatch.length > 0) {
      await processBatch(currentBatch, columns);
      processedRows += currentBatch.length;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    res.json({ 
      message: 'File processed successfully', 
      rowCount: processedRows,
      totalRows: totalRows
    });
  } catch (error) {
    console.error('Error processing file:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Helper function to process a batch of rows
async function processBatch(batch, columns) {
  const insertSQL = `INSERT INTO store_metrics (${columns.map(col => `"${col}"`).join(', ')}) 
                    VALUES (${columns.map(() => '?').join(', ')})`;
  
  const stmt = await db.prepare(insertSQL);
  
  try {
    await db.run('BEGIN TRANSACTION');
    for (const row of batch) {
      await stmt.run(columns.map(col => row[col]));
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  } finally {
    await stmt.finalize();
  }
}

// Query endpoint
app.post('/query', async (req, res) => {
  try {
    const { query = 'SELECT * FROM store_metrics', page = 1, limit = 100 } = req.body;

    // Validate that the table exists
    const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='store_metrics'");
    if (!tableExists) {
      return res.status(404).json({ error: 'No data available. Please upload a file first.' });
    }

    // Get total count
    const total = await db.get('SELECT COUNT(*) as count FROM store_metrics');

    // Add pagination to query if not present
    const offset = (page - 1) * limit;
    let finalQuery = query;
    if (!finalQuery.toLowerCase().includes('limit')) {
      finalQuery = `${query} LIMIT ${limit} OFFSET ${offset}`;
    }
    
    // Execute the query without additional parameters
    const results = await db.all(finalQuery);
    
    res.json({
      data: results,
      total: total.count,
      page,
      limit
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update endpoint
app.post('/update', async (req, res) => {
  try {
    const { filter, updates } = req.body;
    const setClause = Object.keys(updates)
      .map(key => `"${key}" = ?`)
      .join(', ');
    const whereClause = Object.keys(filter)
      .map(key => `"${key}" = ?`)
      .join(' AND ');
    
    const query = `UPDATE store_metrics SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(updates), ...Object.values(filter)];
    
    const result = await db.run(query, params);
    res.json({ affectedRows: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download endpoint
app.get('/download', async (req, res) => {
  try {
    const { query = 'SELECT * FROM store_metrics' } = req.query;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=data.csv');

    const stringifier = stringify({ header: true });
    stringifier.pipe(res);

    const rows = await db.all(query);
    rows.forEach(row => stringifier.write(row));
    stringifier.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup endpoint
app.post('/cleanup', async (req, res) => {
  try {
    const { query } = req.body;
    const result = await db.run(query);
    res.json({ affectedRows: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schema endpoint
app.get('/schema', async (req, res) => {
  try {
    const schema = await db.all("SELECT * FROM pragma_table_info('store_metrics')");
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Count endpoint
app.get('/count', async (req, res) => {
  try {
    const { filter } = req.query;
    let query = 'SELECT COUNT(*) as count FROM store_metrics';
    let params = [];

    if (filter) {
      const conditions = JSON.parse(filter);
      const whereClause = Object.keys(conditions)
        .map(key => `"${key}" = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params = Object.values(conditions);
    }

    const result = await db.get(query, params);
    res.json({ count: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complex store metrics query endpoint
app.get('/store-metrics', async (req, res) => {
  try {
    // Ensure database is initialized
    if (!dbInitialized || !db) {
      console.log('Database not initialized, attempting to initialize...');
      const initialized = await initDb();
      if (!initialized) {
        throw new Error('Failed to initialize database');
      }
    }

    // Check if table exists and has data
    const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='store_metrics'");
    if (!tableExists) {
      console.log('Table does not exist');
      return res.status(404).json({ 
        error: 'No data available',
        message: 'Please upload a CSV file to view store metrics.'
      });
    }

    const rowCount = await db.get('SELECT COUNT(*) as count FROM store_metrics');
    if (!rowCount || rowCount.count === 0) {
      console.log('No data in store_metrics table');
      return res.status(404).json({ 
        error: 'No data available',
        message: 'Please upload a CSV file to view store metrics.'
      });
    }

    console.log(`Found ${rowCount.count} rows in store_metrics table`);

    // Get table columns
    const tableInfo = await db.all("PRAGMA table_info(store_metrics)");
    const existingColumns = tableInfo.map(col => col.name);
    console.log('Existing columns:', existingColumns);

    const query = `
      WITH yesterday_data AS (
        SELECT *
        FROM store_metrics
        WHERE wm_time_window_week = 'Yesterday'
      ),
      l4w_data AS (
        SELECT *
        FROM store_metrics
        WHERE wm_time_window_week = 'L4W'
      )
      SELECT 
        -- No Transformation Columns
        y.wm_time_window_week,
        y.all_links_item_description,
        y.all_links_item_number,
        CAST(COALESCE(y.base_unit_retail_amount, '0') AS NUMERIC) as base_unit_retail_amount,
        y.brand_id,
        y.brand_name,
        y.buyer_name,
        y.consumer_id,
        y.country_of_origin,
        y.omni_category_group_description,
        y.omni_department_number,
        y.season_description,
        y.season_year,
        y.walmart_upc_number,
        y.vendor_name,
        y.vendor_number,
        y.store_number,
        y.city_name,
        y.all_links_item_number || '/' || y.store_number || '/' || y.city_name as "all_links_item_number/store_number/city_name",
        y.catalog_item_id,

        -- L4W Aggregated Data
        CAST(COALESCE(l4w.units_per_str_with_sales_per_week_or_per_day_ty, '0') AS NUMERIC) as l4w_units_per_str_with_sales_per_week_or_per_day_ty,
        CAST(COALESCE(y.units_per_str_with_sales_per_week_or_per_day_ty, '0') AS NUMERIC) as units_per_str_with_sales_per_week_or_per_day_ty,
        CAST(COALESCE(l4w.dollar_per_str_with_sales_per_week_or_per_day_ty, '0') AS NUMERIC) as l4w_dollar_per_str_with_sales_per_week_or_per_day_ty,
        CAST(COALESCE(y.dollar_per_str_with_sales_per_week_or_per_day_ty, '0') AS NUMERIC) as dollar_per_str_with_sales_per_week_or_per_day_ty,
        CAST(COALESCE(y.instock_percentage_this_year, '0') AS NUMERIC) as instock_percentage_this_year,
        CAST(COALESCE(y.store_in_transit_quantity_this_year, '0') AS NUMERIC) as store_in_transit_quantity_this_year,
        CAST(COALESCE(y.store_in_warehouse_quantity_this_year, '0') AS NUMERIC) as store_in_warehouse_quantity_this_year,
        CAST(COALESCE(y.store_on_hand_quantity_this_year, '0') AS NUMERIC) as store_on_hand_quantity_this_year,
        CAST(COALESCE(y.store_on_order_quantity_this_year, '0') AS NUMERIC) as store_on_order_quantity_this_year,
        CAST(COALESCE(l4w.pos_quantity_this_year, '0') AS NUMERIC) as l4w_pos_quantity_this_year,
        CAST(COALESCE(y.pos_quantity_this_year, '0') AS NUMERIC) as pos_quantity_this_year,

        -- Calculated Fields
        CAST(COALESCE(y.pos_quantity_this_year, '0') AS NUMERIC) / 4.0 as average_weekly_sales,
        CAST(COALESCE(y.store_in_transit_quantity_this_year, '0') AS NUMERIC) + 
        CAST(COALESCE(y.store_in_warehouse_quantity_this_year, '0') AS NUMERIC) as pipeline,
        CAST(COALESCE(y.store_on_hand_quantity_this_year, '0') AS NUMERIC) as in_store,
        CAST(COALESCE(y.store_in_warehouse_quantity_this_year, '0') AS NUMERIC) + 
        CAST(COALESCE(y.store_in_transit_quantity_this_year, '0') AS NUMERIC) as pipeline_iw_it,
        
        CASE 
          WHEN CAST(COALESCE(y.pos_quantity_this_year, '0') AS NUMERIC) / 4.0 > 0 THEN 
            (CAST(COALESCE(y.store_on_hand_quantity_this_year, '0') AS NUMERIC) + 
             CAST(COALESCE(y.store_in_warehouse_quantity_this_year, '0') AS NUMERIC) + 
             CAST(COALESCE(y.store_in_transit_quantity_this_year, '0') AS NUMERIC)) /
            (CAST(COALESCE(y.pos_quantity_this_year, '0') AS NUMERIC) / 4.0)
          ELSE NULL
        END as wos_with_instore_pipeline,

        -- Placeholder Fields
        CASE 
          WHEN y.all_links_item_description LIKE 'MS%' THEN 6
          WHEN y.all_links_item_description LIKE 'BHG%' THEN 5
          ELSE NULL
        END as units_per_case_pack,
        
        NULL as case_packs,
        NULL as total_units
      FROM yesterday_data y
      LEFT JOIN l4w_data l4w
        ON y.all_links_item_number = l4w.all_links_item_number
        AND y.store_number = l4w.store_number
      ORDER BY y.store_number, y.all_links_item_number
      LIMIT 1000;
    `;

    console.log('Executing store metrics query...');
    const results = await db.all(query);
    console.log(`Query returned ${results.length} rows`);
    
    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'No data found',
        message: 'No data found. Please upload a CSV file with data.'
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error executing store metrics query:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while fetching store metrics.',
      details: error.message
    });
  }
});

// Database status endpoint
app.get('/db-status', async (req, res) => {
  try {
    // Ensure database is initialized
    if (!dbInitialized || !db) {
      console.log('Database not initialized, attempting to initialize...');
      const initialized = await initDb();
      if (!initialized) {
        return res.status(500).json({
          error: 'Database not initialized',
          message: 'Failed to initialize database'
        });
      }
    }

    // Get table info
    const tableInfo = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='store_metrics'");
    const rowCount = tableInfo ? await db.get('SELECT COUNT(*) as count FROM store_metrics') : { count: 0 };
    
    // Get database file size
    const dbPath = '/app/data.db';
    const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    
    res.json({
      initialized: dbInitialized,
      tableExists: !!tableInfo,
      rowCount: rowCount.count,
      dbSizeBytes: dbSize,
      dbSizeMB: Math.round(dbSize / (1024 * 1024) * 100) / 100
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check database status',
      details: error.message
    });
  }
});

// Database cleanup endpoint
app.post('/db-cleanup', async (req, res) => {
  try {
    if (!dbInitialized || !db) {
      return res.status(500).json({
        error: 'Database not initialized',
        message: 'Failed to initialize database'
      });
    }

    // Drop the store_metrics table
    await db.exec('DROP TABLE IF EXISTS store_metrics');
    
    // Run VACUUM to reclaim space and defragment the database
    await db.exec('VACUUM');

    // Close and reopen the database connection to ensure changes take effect
    await db.close();
    db = await open({
      filename: '/app/data.db',
      driver: sqlite3.Database
    });
    dbInitialized = true;

    res.json({
      message: 'Database cleaned successfully',
      status: 'success'
    });
  } catch (error) {
    console.error('Error cleaning database:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to clean database',
      details: error.message
    });
  }
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 