const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const sqlPath = process.argv[2];
  const sql = sqlPath ? fs.readFileSync(sqlPath, 'utf8') : fs.readFileSync(0, 'utf8');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const result = await client.query(sql);
  await client.end();

  if (result.rows?.length) {
    console.log(JSON.stringify(result.rows, null, 2));
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
