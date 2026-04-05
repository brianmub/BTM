
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  console.log('🚀 Starting comprehensive database schema repair...');
  
  try {
    await client.connect();
    console.log('✅ Connected to Postgres');

    // 0. Repair Organizations
    console.log('Repairing organizations table columns...');
    const orgCols = [
      { name: 'timezone', type: 'TEXT DEFAULT \'UTC\'' },
      { name: 'default_currency', type: 'TEXT DEFAULT \'USD\'' },
      { name: 'features_enabled', type: 'JSONB DEFAULT \'{}\'' },
      { name: 'settings', type: 'JSONB DEFAULT \'{"require_email_verification":false,"allow_self_enrollment":true,"enable_rsvp":true,"enable_location_check":false,"payment_methods":["cash"],"notifications":{"email":true,"push":true,"sms":false}}\'' },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'contact_phone', type: 'TEXT' },
      { name: 'logo_url', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT now()' }
    ];
    for (const col of orgCols) {
      await client.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
    }

    // 1. Repair Sessions table
    console.log('Repairing sessions table columns...');
    const sessionRepairs = [
      { newCol: 'title', fromCol: 'name', type: 'TEXT' },
      { newCol: 'overview', fromCol: 'description', type: 'TEXT' },
      { newCol: 'date', fromCol: 'session_date', type: 'TIMESTAMPTZ' }
    ];

    for (const repair of sessionRepairs) {
      // Add column if it doesn't exist
      await client.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ${repair.newCol} ${repair.type};`);
      // Sync data if the new column is null and old column has data
      await client.query(`UPDATE sessions SET ${repair.newCol} = ${repair.fromCol} WHERE ${repair.newCol} IS NULL AND ${repair.fromCol} IS NOT NULL;`);
    }

    // 2. Repair Programs table
    console.log('Repairing programs table columns...');
    await client.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);
    // Ensure programs have name and description (usually they do, but let's be safe)

    // 3. Repair Enrollments table
    console.log('Repairing enrollments table columns...');
    await client.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);`);
    
    // 4. Create/Verify attendance_records (Ensure multi-tenancy and all columns)
    console.log('Verifying attendance_records table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id),
        checked_in BOOLEAN DEFAULT FALSE,
        checked_in_at TIMESTAMPTZ,
        entry_time TIMESTAMPTZ,
        exit_time TIMESTAMPTZ,
        confirmed_by_leader BOOLEAN DEFAULT FALSE,
        confirmed_at TIMESTAMPTZ,
        UNIQUE(session_id, user_id)
      );
    `);

    // Ensure all columns exist in attendance_records (in case it was partially created)
    const attendanceCols = [
      'organization_id', 'checked_in_at', 'entry_time', 'exit_time', 'confirmed_at'
    ];
    for (const col of attendanceCols) {
      const type = col === 'organization_id' ? 'UUID REFERENCES organizations(id)' : 'TIMESTAMPTZ';
      await client.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS ${col} ${type};`);
    }

    // 5. Create/Verify payment_records
    console.log('Verifying payment_records table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id),
        enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'unpaid', 'completed')),
        payment_method TEXT,
        transaction_reference TEXT,
        receipt_number TEXT,
        unpaid_reason TEXT,
        confirmed_by UUID REFERENCES users(id),
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
      ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS payment_method TEXT;
      ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
      ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS receipt_number TEXT;
      ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
    `);

    // 6. Fix mismatched QR code data
    console.log('Synchronizing sessions.qr_code_data with actual IDs...');
    await client.query(`
      UPDATE sessions 
      SET qr_code_data = 'sess-' || id::text 
      WHERE qr_code_data IS NULL OR qr_code_data NOT LIKE 'sess-' || id::text;
    `);

    console.log('✅ Comprehensive migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
