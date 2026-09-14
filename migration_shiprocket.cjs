const { Client } = require('pg');
const client = new Client('postgresql://postgres.lwvmtjraqvniknstcvpk:Adgjmpu123%40%23@aws-0-ap-south-1.pooler.supabase.com:6543/postgres');
async function run() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS awb_code VARCHAR, 
      ADD COLUMN IF NOT EXISTS courier_name VARCHAR, 
      ADD COLUMN IF NOT EXISTS shiprocket_order_id VARCHAR,
      ADD COLUMN IF NOT EXISTS tracking_status VARCHAR;
    `);
    console.log('orders updated');
  } catch(e) {
    console.log(e.message);
  }
  client.end();
}
run();
