const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  server: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '1433', 10),
  database: process.env.DATABASE_NAME || process.env.DATABASE_SCHEMA,
  options: {
    encrypt: (process.env.DATABASE_ENCRYPT ?? 'false').toLowerCase() === 'true' || (process.env.DATABASE_ENCRYPT ?? 'false').toLowerCase() === '1',
    trustServerCertificate: true
  }
};

async function run() {
  try {
    console.log('Connecting with config:', { ...config, password: '***' });
    let pool = await sql.connect(config);
    console.log('Connected successfully.');
    
    // Check schemas
    let result = await pool.request().query(
      `SELECT schema_name FROM information_schema.schemata`
    );
    console.log('Existing schemas:', result.recordset.map(r => r.schema_name));
    
    let poscsExists = result.recordset.some(r => r.schema_name.toUpperCase() === 'POSCS');
    if (!poscsExists) {
      console.log('Schema POSCS does not exist. Attempting to create it...');
      await pool.request().query("EXEC('CREATE SCHEMA POSCS')");
      console.log('Schema POSCS created successfully!');
    } else {
      console.log('Schema POSCS already exists.');
    }
    
    await sql.close();
  } catch (err) {
    console.error('Error occurred:', err);
    process.exit(1);
  }
}

run();
