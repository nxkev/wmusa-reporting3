import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { parse } from 'csv-parse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDb() {
  // Open database connection
  const db = await open({
    filename: join(__dirname, '../data/database.sqlite'),
    driver: sqlite3.Database
  });

  // Create table with appropriate columns
  await db.exec(`
    CREATE TABLE IF NOT EXISTS store_metrics (
      wm_time_window_week TEXT,
      all_links_item_description TEXT,
      all_links_item_number TEXT,
      base_unit_retail_amount TEXT,
      brand_id TEXT,
      brand_name TEXT,
      buyer_name TEXT,
      consumer_id TEXT,
      country_of_origin TEXT,
      omni_category_group_description TEXT,
      omni_department_number TEXT,
      season_description TEXT,
      season_year TEXT,
      walmart_upc_number TEXT,
      vendor_name TEXT,
      vendor_number TEXT,
      store_number TEXT,
      city_name TEXT,
      catalog_item_id TEXT,
      units_per_str_with_sales_per_week_or_per_day_ty TEXT,
      dollar_per_str_with_sales_per_week_or_per_day_ty TEXT,
      gross_receipt_quantity_this_year TEXT,
      net_receipt_quantity_this_year TEXT,
      total_store_customer_returns_quantity_defective_this_year TEXT,
      instock_percentage_this_year TEXT,
      repl_instock_percentage_this_year TEXT,
      store_in_transit_quantity_this_year TEXT,
      store_in_warehouse_quantity_this_year TEXT,
      store_on_hand_quantity_this_year TEXT,
      store_on_order_quantity_this_year TEXT,
      valid_store_count_this_year TEXT,
      pos_quantity_this_year TEXT,
      pos_sales_this_year TEXT
    )
  `);

  // Read and parse the CSV file
  const fileStream = fs.createReadStream(join(__dirname, '../../input-files/store_level_mock_data.csv'));
  const parser = parse({
    columns: true,
    skip_empty_lines: true
  });

  // Insert data into the database
  let count = 0;
  for await (const row of fileStream.pipe(parser)) {
    const columns = Object.keys(row);
    const values = columns.map(col => row[col]);
    const placeholders = values.map(() => '?').join(', ');
    
    await db.run(
      `INSERT INTO store_metrics (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );
    count++;
  }

  console.log(`Successfully imported ${count} rows into the database`);
  await db.close();
}

// Run the initialization
initDb().catch(console.error); 