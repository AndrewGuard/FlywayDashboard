const { Pool } = require('pg');

// Try different passwords
const passwords = [
  'Redg@te1',
  'Redgate1',
  'postgres',
  'password',
  'admin'
];

async function testConnection(password) {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'pagila_test',
    user: 'postgres',
    password: password
  });

  try {
    const result = await pool.query('SELECT 1 as test');
    console.log(`SUCCESS with password: ${password}`);
    await pool.end();
    return true;
  } catch (e) {
    console.log(`FAILED with password: ${password} - ${e.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('Testing PostgreSQL connections...\n');
  
  for (const pwd of passwords) {
    const success = await testConnection(pwd);
    if (success) {
      console.log(`\nUse this password in flywayHistory.js: ${pwd}`);
      break;
    }
  }
}

main();