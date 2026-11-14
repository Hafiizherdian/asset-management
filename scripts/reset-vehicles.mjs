import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("truncate vehicles, import_logs");
await client.end();
console.log("Data kendaraan dan riwayat impor dikosongkan.");