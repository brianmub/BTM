import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  await client.connect();
  console.log('Connected to DB.');
  
  try {
    // 1. users table
    console.log('Updating users table...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS church_name TEXT;');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS residential_address TEXT;');
    
    // Update marital_status constraint if it exists
    // First, let's remove the old constraint if it exists. 
    // Usually named something like 'users_marital_status_check'
    console.log('Checking marital_status constraint...');
    try {
        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_marital_status_check;');
    } catch (e) {
        console.log('Notice: Could not drop constraint (might not exist with that name)');
    }
    
    // 2. payment_records table
    console.log('Updating payment_records table...');
    await client.query('ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS receipt_number TEXT;');
    
    console.log('Migration complete successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
