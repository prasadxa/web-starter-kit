const fs = require('fs');
const { Client } = require('pg');

async function runRestore() {
    // Read the connection string from .env manually to grab it
    const env = fs.readFileSync('.env', 'utf-8');
    const dbUrlMatch = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
    if (!dbUrlMatch) {
        console.error("DATABASE_URL not found in .env");
        process.exit(1);
    }
    const connectionString = dbUrlMatch[1];

    const client = new Client({ connectionString });
    try {
        console.log("Connecting to Neon DB...");
        await client.connect();
        console.log("Connected to Neon DB!");
        
        console.log("Reading my_database_backup.sql...");
        const sql = fs.readFileSync('my_database_backup.sql', 'utf-8');
        
        console.log("Restoring backup... this might take a minute depending on size.");
        await client.query(sql);
        console.log("Restore completed successfully!");
    } catch(err) {
        console.error("Error during restore:", err);
    } finally {
        await client.end();
    }
}

runRestore();
