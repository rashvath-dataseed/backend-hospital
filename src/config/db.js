const { Pool } = require("pg");

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false,
    },
});

pool.connect()
    .then(() => {
        console.log("✅ Cloud PostgreSQL Connected");
    })
    .catch((err) => {
        console.log("❌ Database connection error:", err.message);
    });

module.exports = pool;