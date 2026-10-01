import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres.lwvmtjraqvniknstcvpk',
  password: 'Adgjmpu123@#',
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database!');

    await client.query(`
      ALTER TABLE public.professional_profiles 
      ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('Successfully added services JSONB column to professional_profiles!');

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'professional_profiles' AND column_name = 'services';
    `);
    console.log('Verification:', res.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
