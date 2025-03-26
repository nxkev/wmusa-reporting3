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

// Initialize SQLite database
let db;
const initDb = async () => {
  db = await open({
    filename: join(__dirname, '../data/database.sqlite'),
    driver: sqlite3.Database
  });
};

// Ensure data and uploads directories exist
const dataDir = join(__dirname, '../data');
const uploadsDir = join(__dirname, '../uploads');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Initialize database on startup
initDb().catch(console.error);

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

    // First pass: get columns and create table
    for await (const row of fileStream.pipe(parser)) {
      if (!columns) {
        columns = Object.keys(row);
        
        // Drop existing table if schema is different
        const existingSchema = await db.all("SELECT * FROM pragma_table_info('store_metrics')");
        const existingColumns = existingSchema.map(col => col.name);
        const schemaChanged = !columns.every(col => existingColumns.includes(col)) || 
                            !existingColumns.every(col => columns.includes(col));
        
        if (schemaChanged) {
          console.log('Schema changed, recreating table');
          await db.exec('DROP TABLE IF EXISTS store_metrics');
          
          // Create table based on CSV header
          const createTableSQL = `CREATE TABLE store_metrics (
            ${columns.map(col => {
              // Try to infer column type from first row
              const value = row[col];
              let type = 'TEXT';
              if (!isNaN(value) && value.trim() !== '') {
                type = value.includes('.') ? 'REAL' : 'INTEGER';
              }
              return `"${col}" ${type}`;
            }).join(', ')}
          )`;
          await db.exec(createTableSQL);
        } else {
          // Clear existing data if schema is the same
          await db.exec('DELETE FROM store_metrics');
        }
      }

      currentBatch.push(row);
      
      // Process batch when it reaches the size limit
      if (currentBatch.length >= BATCH_SIZE) {
        await processBatch(currentBatch, columns);
        totalRows += currentBatch.length;
        currentBatch = [];
      }
    }

    // Process remaining rows
    if (currentBatch.length > 0) {
      await processBatch(currentBatch, columns);
      totalRows += currentBatch.length;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    res.json({ 
      message: 'File processed successfully', 
      rowCount: totalRows,
      columns: columns 
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 